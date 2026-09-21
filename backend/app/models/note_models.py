from pydantic import BaseModel


class UploadNoteResponse(BaseModel):
    message: str
    file_name: str
    extracted_text: str
    ai_content: dict
