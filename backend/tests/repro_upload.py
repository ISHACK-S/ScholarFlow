import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.chdir(str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv
load_dotenv('.env')

from app.routes import notes_routes

notes_routes.get_authenticated_user_id = lambda authorization: '12345678-1234-1234-1234-123456789abc'
notes_routes.extract_text_from_pdf = lambda content: 'hello world'
notes_routes.generate_ai_content = lambda text: {'summary': 'ok', 'key_points': [], 'definitions': [], 'formulas': [], 'quiz': [], 'video_script': ''}
notes_routes.analytics_service.update = lambda *args, **kwargs: None

class DummyUploadFile:
    filename = 'test.pdf'
    size = 100

    async def read(self):
        return b'%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n'

async def main():
    try:
        result = await notes_routes.upload_note(file=DummyUploadFile(), authorization='Bearer test')
        print('RESULT', result)
    except Exception:
        import traceback
        traceback.print_exc()

asyncio.run(main())
