import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.database.supabase_client import get_supabase_client
from app.services.auth_service import get_authenticated_user_id


class AnalyticsService:
    def __init__(self):
        self.client = get_supabase_client()

    def _user_id(self, authorization: Optional[str]) -> str:
        return get_authenticated_user_id(authorization)

    def _ensure_record(self, user_id: str, note_id: Optional[str] = None) -> Dict[str, Any]:
        if self.client is None:
            raise RuntimeError('Supabase is not configured.')

        try:
            response = self.client.table('learning_analytics').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()
        except Exception:
            response = None

        existing = (response.data or [{}])[0] if response else {}
        if existing:
            return existing

        payload = {
            'id': str(__import__('uuid').uuid4()),
            'user_id': user_id,
            'note_id': note_id,
            'quiz_score': 0,
            'correct_answers': 0,
            'wrong_answers': 0,
            'percentage': 0,
            'study_time_minutes': 0,
            'quiz_attempts': 0,
            'notes_opened': 0,
            'notes_completed': 0,
            'video_script_opened': 0,
            'quiz_started': 0,
            'quiz_completed': 0,
            'completion_percentage': 0,
            'topics_completed': 0,
            'last_activity': datetime.now(timezone.utc).isoformat(),
            'created_at': datetime.now(timezone.utc).isoformat(),
        }
        self.client.table('learning_analytics').insert(payload).execute()
        return payload

    def update(self, authorization: Optional[str], event: str, note_id: Optional[str] = None, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if self.client is None:
            raise RuntimeError('Supabase is not configured.')

        user_id = self._user_id(authorization)
        record = self._ensure_record(user_id, note_id)
        updates: Dict[str, Any] = {'last_activity': datetime.now(timezone.utc).isoformat()}

        if event == 'upload_note':
            updates['notes_completed'] = int(record.get('notes_completed', 0)) + 1
            updates['completion_percentage'] = self._calculate_completion(record, updates)
        elif event == 'open_note':
            updates['notes_opened'] = int(record.get('notes_opened', 0)) + 1
            updates['completion_percentage'] = self._calculate_completion(record, updates)
        elif event == 'view_summary':
            updates['completion_percentage'] = self._calculate_completion(record, {'summary_viewed': True})
        elif event == 'view_key_points':
            updates['completion_percentage'] = self._calculate_completion(record, {'key_points_viewed': True})
        elif event == 'view_video_script':
            updates['video_script_opened'] = int(record.get('video_script_opened', 0)) + 1
            updates['completion_percentage'] = self._calculate_completion(record, {'video_script_viewed': True})
        elif event == 'start_quiz':
            updates['quiz_started'] = int(record.get('quiz_started', 0)) + 1
            updates['completion_percentage'] = self._calculate_completion(record, {'quiz_started': True})
        elif event == 'submit_quiz':
            updates['quiz_completed'] = int(record.get('quiz_completed', 0)) + 1
            updates['quiz_attempts'] = int(record.get('quiz_attempts', 0)) + 1
            updates['quiz_score'] = payload.get('score', 0) if payload else 0
            updates['correct_answers'] = payload.get('correct_answers', 0) if payload else 0
            updates['wrong_answers'] = payload.get('wrong_answers', 0) if payload else 0
            updates['percentage'] = payload.get('percentage', 0) if payload else 0
            updates['completion_percentage'] = self._calculate_completion(record, {'quiz_completed': True})
        elif event == 'download_video_script':
            updates['video_script_opened'] = int(record.get('video_script_opened', 0)) + 1
        elif event == 'open_dashboard':
            updates['notes_opened'] = int(record.get('notes_opened', 0)) + 1

        if event == 'study_session':
            updates['study_time_minutes'] = int(record.get('study_time_minutes', 0)) + int(payload.get('minutes', 0)) if payload else int(record.get('study_time_minutes', 0))

        self.client.table('learning_analytics').update(updates).eq('user_id', user_id).execute()
        refreshed = self.client.table('learning_analytics').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()
        return (refreshed.data or [{}])[0]

    def get_for_user(self, authorization: Optional[str]) -> List[Dict[str, Any]]:
        user_id = self._user_id(authorization)
        response = self.client.table('learning_analytics').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return response.data or []

    def get_dashboard_stats(self, authorization: Optional[str]) -> Dict[str, Any]:
        records = self.get_for_user(authorization)
        if not records:
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

        record = records[0]
        weak_topics = []
        strong_topics = []
        if record.get('percentage', 0) < 50:
            weak_topics.append('Quiz understanding')
        else:
            strong_topics.append('Quiz understanding')

        if record.get('completion_percentage', 0) >= 80:
            strong_topics.append('Study material review')
        else:
            weak_topics.append('Study material review')

        return {
            'study_time_minutes': record.get('study_time_minutes', 0),
            'notes_uploaded': record.get('notes_completed', 0),
            'notes_completed': record.get('notes_completed', 0),
            'average_quiz_score': record.get('percentage', 0),
            'best_quiz_score': max(record.get('percentage', 0), record.get('quiz_score', 0)),
            'weak_topics': weak_topics,
            'strong_topics': strong_topics,
            'completion_percentage': record.get('completion_percentage', 0),
            'recent_activity': [{'event': 'activity', 'detail': record.get('last_activity', '')}],
        }

    def _calculate_completion(self, record: Dict[str, Any], extra: Dict[str, Any]) -> int:
        progress = 0
        if record.get('notes_completed') or extra.get('notes_completed'):
            progress += 25
        if record.get('notes_opened') or extra.get('notes_opened'):
            progress += 20
        if record.get('quiz_completed') or extra.get('quiz_completed') or extra.get('quiz_started'):
            progress += 25
        if record.get('video_script_opened') or extra.get('video_script_viewed'):
            progress += 20
        if record.get('study_time_minutes') or extra.get('study_time_minutes'):
            progress += 10
        return min(progress, 100)
