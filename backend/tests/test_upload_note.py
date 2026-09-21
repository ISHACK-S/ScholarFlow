import asyncio
from unittest.mock import MagicMock

from app.routes import notes_routes


class DummyUploadFile:
    def __init__(self):
        self.filename = "test.pdf"
        self.size = 100

    async def read(self):
        return b"dummy pdf"


def test_upload_note_builds_storage_path_and_succeeds(monkeypatch):
    fake_client = MagicMock()
    fake_storage = MagicMock()
    fake_storage.upload.return_value = MagicMock()
    fake_storage.get_public_url.return_value = {"publicUrl": "https://example.com/file.pdf"}
    fake_client.storage.from_.return_value = fake_storage

    fake_table = MagicMock()
    fake_table.insert.return_value.execute.return_value = None
    fake_update = MagicMock()
    fake_update.eq.return_value.execute.return_value = None
    fake_table.update.return_value = fake_update
    fake_client.table.return_value = fake_table

    monkeypatch.setattr(notes_routes, "get_supabase_client", lambda: fake_client)
    monkeypatch.setattr(notes_routes, "get_authenticated_user_id", lambda authorization: "user-123")
    monkeypatch.setattr(notes_routes, "extract_text_from_pdf", lambda content: "extracted text")
    monkeypatch.setattr(notes_routes, "generate_ai_content", lambda text: {"summary": "ok", "key_points": [], "definitions": [], "formulas": [], "quiz": [], "video_script": ""})
    monkeypatch.setattr(notes_routes.analytics_service, "update", lambda *args, **kwargs: None)

    async def run_test():
        return await notes_routes.upload_note(file=DummyUploadFile(), authorization="Bearer token")

    result = asyncio.run(run_test())

    assert result["note_id"]
    assert fake_storage.upload.call_count == 1
    storage_path = fake_storage.upload.call_args.args[0]
    assert storage_path.startswith("notes/user-123/")
