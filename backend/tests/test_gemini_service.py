import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.gemini_service import generate_ai_content


def test_generate_ai_content_without_api_key_returns_default_payload():
    os.environ.pop('GEMINI_API_KEY', None)
    result = generate_ai_content('Sample notes')

    assert result['summary'] == 'AI content generation is unavailable right now.'
    assert result['key_points'] == []
    assert result['quiz'] == []
    assert result['video_script'] == 'AI content generation is unavailable right now.'
