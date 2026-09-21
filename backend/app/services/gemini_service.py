import json
import re
import traceback
from app.config.settings import GEMINI_API_KEY


try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - handled for lightweight environments
    genai = None

API_KEY = GEMINI_API_KEY

if API_KEY and genai is not None:
    genai.configure(api_key=API_KEY)
    print('Gemini initialization: configured')
else:
    print(f'Gemini initialization: unavailable (sdk_loaded={genai is not None}, api_key_present={bool(API_KEY)})')


def _normalize_quiz(value) -> list:
    if isinstance(value, dict):
        value = value.get('questions') or value.get('items') or value.get('quiz')

    if not isinstance(value, list):
        return []

    normalized = []
    for item in value:
        if not isinstance(item, dict):
            continue

        question = item.get('question') or item.get('question_text')
        options = item.get('options') or item.get('choices')
        correct_answer = item.get('correct_answer') or item.get('answer') or item.get('correctAnswer')
        if (
            isinstance(question, str)
            and isinstance(options, list)
            and len(options) == 4
            and all(isinstance(option, str) and option.strip() for option in options)
            and isinstance(correct_answer, str)
            and correct_answer in options
        ):
            normalized.append({
                'question': question.strip(),
                'options': [option.strip() for option in options],
                'correct_answer': correct_answer,
                'explanation': item.get('explanation', ''),
            })
    return normalized


def generate_ai_content(text: str) -> dict:
    default_payload = {
        'summary': 'AI content generation is unavailable right now.',
        'key_points': [],
        'definitions': [],
        'formulas': [],
        'quiz': [],
        'video_script': 'AI content generation is unavailable right now.'
    }

    if not API_KEY or genai is None:
        raise RuntimeError(
            f'Gemini is not configured: sdk_loaded={genai is not None}, '
            f'api_key_present={bool(API_KEY)}'
        )

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        You are an academic study assistant.
        Analyze the following study notes and return valid JSON with exactly these keys:
        - summary: short summary string
        - key_points: array of strings
        - definitions: array of strings
        - formulas: array of strings
        - quiz: exactly 5 objects; every object must contain question, exactly 4 options, and correct_answer
        - video_script: string

        Quiz requirements:
        - Generate exactly 5 multiple-choice questions based only on the notes.
        - Each question must have exactly 4 distinct string options.
        - correct_answer must exactly match one of the 4 options.
        - Return JSON only. Do not use Markdown or code fences.

        Notes:
        {text}
        """

        response = model.generate_content(
            prompt,
            generation_config={
                'response_mime_type': 'application/json',
                'temperature': 0.2,
            },
        )
        content = (getattr(response, 'text', '') or '').strip()
        content = re.sub(r'^```(?:json)?\s*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'\s*```$', '', content).strip()
        parsed = json.loads(content)

        if not isinstance(parsed, dict):
            raise ValueError('Gemini returned a non-object response.')

        quiz = _normalize_quiz(parsed.get('quiz') or parsed.get('questions'))
        if len(quiz) != 5:
            raise ValueError(
                f'Gemini returned {len(quiz)} valid quiz questions; exactly 5 are required.'
            )
        print(f'Gemini generation succeeded: parsed_keys={sorted(parsed.keys())}, quiz_item_count={len(quiz)}')

        return {
            'summary': parsed.get('summary', default_payload['summary']),
            'key_points': parsed.get('key_points', []) if isinstance(parsed.get('key_points', []), list) else [],
            'definitions': parsed.get('definitions', []) if isinstance(parsed.get('definitions', []), list) else [],
            'formulas': parsed.get('formulas', []) if isinstance(parsed.get('formulas', []), list) else [],
            'quiz': quiz,
            'video_script': parsed.get('video_script', default_payload['video_script'])
        }
    except Exception as exc:
        print(f'Gemini generation failed: {type(exc).__name__}: {exc}')
        traceback.print_exc()
        raise
