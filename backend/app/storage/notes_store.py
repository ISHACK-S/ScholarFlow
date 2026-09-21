import json
from pathlib import Path
from typing import List, Dict, Any

DATA_FILE = Path(__file__).resolve().parent / 'notes.json'


def _read_store() -> List[Dict[str, Any]]:
    if not DATA_FILE.exists():
        return []

    try:
        with DATA_FILE.open('r', encoding='utf-8') as handle:
            return json.load(handle)
    except (json.JSONDecodeError, OSError):
        return []


def _write_store(items: List[Dict[str, Any]]) -> None:
    with DATA_FILE.open('w', encoding='utf-8') as handle:
        json.dump(items, handle, indent=2)


def save_note(note: Dict[str, Any]) -> Dict[str, Any]:
    notes = _read_store()
    notes.insert(0, note)
    _write_store(notes)
    return note


def list_notes() -> List[Dict[str, Any]]:
    return _read_store()


def clear_notes() -> None:
    _write_store([])
