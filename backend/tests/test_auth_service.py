import pytest
from fastapi import HTTPException

from app.services.auth_service import get_authenticated_user_id


def test_requires_auth_header():
    with pytest.raises(HTTPException) as exc_info:
        get_authenticated_user_id(None)

    assert exc_info.value.status_code == 401
