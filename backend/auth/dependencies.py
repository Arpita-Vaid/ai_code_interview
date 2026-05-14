from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.auth.jwt_handler import verify_access_token

bearer_scheme = HTTPBearer()

_401 = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — validates Bearer token, returns the User model.
    Returns 401 for any token issue (expired, malformed, missing).
    Returns 403 if account is deactivated.
    """
    try:
        token = credentials.credentials
        user_id = verify_access_token(token)
        user = db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        raise _401

    if not user:
        raise _401                    # Don't reveal whether user exists
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support.",
        )
    return user
