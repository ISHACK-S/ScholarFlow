import re
from io import BytesIO
from pypdf import PdfReader


def clean_extracted_text(text: str) -> str:
    if not text:
        return ''

    normalized = re.sub(r'\s+', ' ', text)
    normalized = normalized.replace('\u00a0', ' ')
    normalized = re.sub(r'\s*\n\s*', '\n\n', normalized)
    lines = [line.strip() for line in normalized.splitlines() if line.strip()]
    return '\n\n'.join(lines).strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    if not file_bytes:
        raise ValueError('The uploaded PDF is empty.')

    if len(file_bytes) > 20 * 1024 * 1024:
        raise ValueError('The uploaded PDF is too large to process.')

    try:
        reader = PdfReader(BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError('The PDF file appears to be corrupted or unreadable.') from exc

    if not reader.pages:
        raise ValueError('The PDF does not contain any pages.')

    pages = []
    for page in reader.pages:
        text = page.extract_text() or ''
        pages.append(text)

    cleaned_text = '\n\n'.join(pages).strip()
    if not cleaned_text:
        raise ValueError('The PDF content was empty after extraction.')

    return clean_extracted_text(cleaned_text)
