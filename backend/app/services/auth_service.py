from typing import Optional

from fastapi import HTTPException, Header

from app.database.supabase_client import get_supabase_auth_client


def get_authenticated_user_id(
    authorization: Optional[str] = Header(None)
) -> str:

    print("\n========== AUTH DEBUG ==========")
    print("Authorization Header:", authorization)

    if not authorization:
        print("No Authorization header received.")
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    if not authorization.startswith("Bearer "):
        print("Authorization header is not Bearer.")
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    token = authorization.split(" ", 1)[1].strip()

    print("Token exists:", bool(token))
    if token:
        print("Token Preview:", token[:25] + "...")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    client = get_supabase_auth_client()

    print("Supabase Auth Client:", client)

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured."
        )

    try:
        print("Calling Supabase get_user()...")
        response = client.auth.get_user(token)

        print("Supabase Response:")
        print(response)

    except Exception as exc:
        print("AUTH ERROR:", repr(exc))
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        ) from exc

    data = getattr(response, "data", None)
    user = getattr(response, "user", None)

    print("response.user =", user)
    print("response.data =", data)

    candidate = user or data

    if candidate is None:
        print("No user returned by Supabase.")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )

    if isinstance(candidate, dict):
        user_id = candidate.get("id") or candidate.get("user", {}).get("id")
    else:
        user_id = getattr(candidate, "id", None)

    print("Extracted User ID:", user_id)

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )

    print("========== AUTH SUCCESS ==========\n")

    return user_id