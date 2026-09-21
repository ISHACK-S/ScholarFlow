import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database.supabase_client import get_supabase_client
from app.services.auth_service import get_authenticated_user_id
from app.services.pdf_service import extract_text_from_pdf
from app.services.gemini_service import generate_ai_content
from app.services.analytics.analytics_service import AnalyticsService

router = APIRouter()
security = HTTPBearer()
analytics_service = AnalyticsService()


def _normalize_quiz_data(value) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except Exception:
            return []
        return parsed if isinstance(parsed, list) else []
    return []


@router.post('/upload-note')
async def upload_note(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):

    authorization = f"{credentials.scheme} {credentials.credentials}"

    try:
        print("===== Upload Started =====")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail='Only PDF files are allowed.')

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail='File exceeds 10MB limit.')

    content = await file.read()
    print("PDF Read Successfully")

    if not content:
        raise HTTPException(status_code=400, detail='The uploaded file is empty.')

    try:
        extracted_text = extract_text_from_pdf(content)
        print("PDF Text Extracted")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not extracted_text:
        raise HTTPException(status_code=400, detail='The PDF did not contain any readable text.')

    client = get_supabase_client()
    print("Supabase Client:", client)

    if client is None:
        raise HTTPException(status_code=500, detail='Supabase is not configured.')

    user_id = get_authenticated_user_id(authorization)
    print("User ID:", user_id)

    safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
    storage_path = f"notes/{user_id}/{uuid.uuid4().hex}_{safe_filename}"

    try:
        print("Uploading to Storage...")
        upload_result = client.storage.from_("notes").upload(
            storage_path,
            content,
            file_options={
                "content-type": "application/pdf",
                "upsert": "false",
            },
        )

        print("Upload Result:", upload_result)

    except Exception as exc:
        import traceback
        traceback.print_exc()
        print("UPLOAD ERROR:", repr(exc))
        raise

    try:
        signed_url_response = client.storage.from_("notes").create_signed_url(
            storage_path,
            60 * 60,
        )

        if isinstance(signed_url_response, dict):
            file_url = signed_url_response.get("signedURL") or signed_url_response.get("signedUrl")
        else:
            file_url = (
                getattr(signed_url_response, "signedURL", None)
                or getattr(signed_url_response, "signedUrl", None)
            )

        if not file_url:
            raise ValueError("Supabase did not return a signed URL.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Could not generate signed URL: {str(exc)}') from exc

    note_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    note_payload = {
        'id': note_id,
        'user_id': user_id,
        'title': file.filename.rsplit('.', 1)[0],
        'file_name': file.filename,
        'file_url': file_url,
        'raw_text': '',
        'summary': '',
        'key_points': '',
        'definitions': '',
        'formulas': '',
        'quiz': [],
        'video_script': '',
        'created_at': created_at,
    }

    try:
        client.table('notes').insert(note_payload).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Could not save note metadata: {str(exc)}') from exc

    try:
        ai_data = generate_ai_content(extracted_text)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Gemini generation failed: {type(exc).__name__}: {str(exc)}"
        ) from exc
    update_payload = {
        'raw_text': extracted_text,
        'summary': ai_data.get('summary', ''),
        'key_points': '\n'.join(ai_data.get('key_points', []) or []),
        'definitions': '\n'.join(ai_data.get('definitions', []) or []),
        'formulas': '\n'.join(ai_data.get('formulas', []) or []),
        'quiz': ai_data.get('quiz', []) or [],
        'video_script': ai_data.get('video_script', ''),
    }

    try:
        client.table('notes').update(update_payload).eq('id', note_id).execute()
    except Exception as exc:
        print("NOTE UPDATE ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail=f'Could not save generated content: {str(exc)}') from exc

    try:
        analytics_service.update(authorization, 'upload_note', note_id)
    except Exception:
        pass

    return {
        'message': 'Note uploaded successfully to Supabase.',
        'file_name': file.filename,
        'file_url': note_payload['file_url'],
        'note_id': note_id,
        'ai_content': ai_data,
    }


@router.get('/notes')
async def get_notes(credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=500, detail='Supabase is not configured.')

    user_id = get_authenticated_user_id(authorization)

    try:
        response = client.table('notes').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Could not fetch notes: {str(exc)}') from exc

    return {'notes': response.data or []}


@router.get('/notes/{note_id}')
async def get_note_detail(note_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=500, detail='Supabase is not configured.')

    user_id = get_authenticated_user_id(authorization)

    try:
        response = client.table('notes').select('*').eq('id', note_id).eq('user_id', user_id).single().execute()
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f'Note not found: {str(exc)}') from exc

    if not response.data:
        raise HTTPException(status_code=404, detail='Note not found')

    note = response.data

    try:
        analytics_service.update(authorization, 'open_note', note_id)
        if note.get('summary'):
            analytics_service.update(authorization, 'view_summary', note_id)
        if note.get('video_script'):
            analytics_service.update(authorization, 'view_video_script', note_id)
    except Exception:
        pass

    return {
        'id': note['id'],
        'file_name': note['file_name'],
        'file_url': note['file_url'],
        'summary': note.get('summary', ''),
        'key_points': [item for item in (note.get('key_points') or '').split('\n') if item],
        'definitions': [item for item in (note.get('definitions') or '').split('\n') if item],
        'formulas': [item for item in (note.get('formulas') or '').split('\n') if item],
        'quiz': _normalize_quiz_data(note.get('quiz')),
        'video_script': note.get('video_script', ''),
    }


@router.get('/quiz/{note_id}')
async def get_quiz(note_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=500, detail='Supabase is not configured.')

    user_id = get_authenticated_user_id(authorization)

    try:
        response = client.table('notes').select('id, file_name, quiz').eq('id', note_id).eq('user_id', user_id).single().execute()
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f'Note not found: {str(exc)}') from exc

    note = response.data
    quiz_data = _normalize_quiz_data(note.get('quiz'))
    if not quiz_data:
        raise HTTPException(status_code=404, detail='No quiz was generated for this note.')

    try:
        analytics_service.update(authorization, 'start_quiz', note_id)
    except Exception:
        pass

    return {
        'note_id': note['id'],
        'title': note.get('file_name', 'Quiz'),
        'quiz': quiz_data,
    }


@router.post('/submit-quiz')
async def submit_quiz(payload: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=500, detail='Supabase is not configured.')

    user_id = get_authenticated_user_id(authorization)

    note_id = payload.get('note_id')
    answers = payload.get('answers') or {}
    time_taken = payload.get('time_taken', 0)

    if not note_id:
        raise HTTPException(status_code=400, detail='Missing note id.')

    try:
        note_response = client.table('notes').select('quiz').eq('id', note_id).eq('user_id', user_id).single().execute()
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f'Note not found: {str(exc)}') from exc

    quiz_data = _normalize_quiz_data(note_response.data.get('quiz'))
    if not quiz_data:
        raise HTTPException(status_code=404, detail='No quiz available for this note.')

    correct_answers = 0
    for index, item in enumerate(quiz_data):
        if answers.get(index) == item.get('correct_answer'):
            correct_answers += 1

    wrong_answers = len(quiz_data) - correct_answers
    score = correct_answers
    percentage = round((correct_answers / len(quiz_data)) * 100) if quiz_data else 0

    attempt_payload = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'note_id': note_id,
        'score': score,
        'correct_answers': correct_answers,
        'wrong_answers': wrong_answers,
        'total_questions': len(quiz_data),
        'percentage': percentage,
        'time_taken': time_taken,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }

    try:
        client.table('quiz_scores').insert(attempt_payload).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Could not save quiz result: {str(exc)}') from exc

    try:
        analytics_service.update(
            authorization,
            'submit_quiz',
            note_id,
            {
                'score': score,
                'correct_answers': correct_answers,
                'wrong_answers': wrong_answers,
                'percentage': percentage,
            },
        )
    except Exception:
        pass

    return {
        'score': score,
        'correct_answers': correct_answers,
        'wrong_answers': wrong_answers,
        'percentage': percentage,
        'time_taken': time_taken,
    }


@router.get('/quiz-history/{note_id}')
async def get_quiz_history(note_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=500, detail='Supabase is not configured.')

    user_id = get_authenticated_user_id(authorization)

    try:
        response = client.table('quiz_scores').select('*').eq('note_id', note_id).eq('user_id', user_id).order('created_at', desc=True).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Could not load quiz history: {str(exc)}') from exc

    return {'history': response.data or []}


@router.get('/auth/session')
async def get_session(credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    user_id = get_authenticated_user_id(authorization)
    return {'authenticated': True, 'user_id': user_id}


@router.get('/analytics/dashboard')
async def get_dashboard_analytics(credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    try:
        return analytics_service.get_dashboard_stats(authorization)
    except Exception:
        return {
            'study_time_minutes': 0,
            'notes_uploaded': 0,
            'notes_completed': 0,
            'average_quiz_score': 0,
            'best_quiz_score': 0,
            'weak_topics': [],
            'strong_topics': [],
            'completion_percentage': 0,
            'recent_activity': [],
        }


@router.get('/quiz-stats')
async def get_quiz_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    authorization = f"{credentials.scheme} {credentials.credentials}"
    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=500, detail='Supabase is not configured.')
    print("Authorization Header:", authorization)
    user_id = get_authenticated_user_id(authorization)
    print("User ID:", user_id)

    try:
        response = client.table('quiz_scores').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Could not load quiz stats: {str(exc)}') from exc

    attempts = response.data or []
    if not attempts:
        return {'latestScore': 0, 'bestScore': 0, 'averageScore': 0, 'attempts': 0}

    latest_score = attempts[0].get('score', 0)
    best_score = max(item.get('score', 0) for item in attempts)
    average_score = round(sum(item.get('score', 0) for item in attempts) / len(attempts), 1)

    return {
        'latestScore': latest_score,
        'bestScore': best_score,
        'averageScore': average_score,
        'attempts': len(attempts),
    }
