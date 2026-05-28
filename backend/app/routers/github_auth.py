"""GitHub OAuth2 authentication router.

Flow:
  1. Frontend redirects user to GitHub OAuth URL (built client-side with VITE_GITHUB_CLIENT_ID).
  2. GitHub redirects to the frontend callback page with ?code=...&state=...
  3. Frontend POSTs {code, state} to POST /api/auth/github/callback.
  4. Backend exchanges code for GitHub access token, fetches user profile, creates/links
     the local User record, and returns a JWT just like the password login endpoint.
"""

import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.routers.auth import create_access_token

router = APIRouter()

GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


class GitHubCallbackRequest(BaseModel):
    code: str
    state: str | None = None


@router.get("/login")
def github_login():
    """Return the GitHub OAuth authorisation URL for the frontend to redirect to."""
    if not settings.github_client_id:
        raise HTTPException(status_code=503, detail="GITHUB_OAUTH_NOT_CONFIGURED")
    state = secrets.token_urlsafe(16)
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.github_redirect_uri}"
        f"&scope=user:email"
        f"&state={state}"
    )
    return {"url": url, "state": state}


@router.post("/callback")
def github_callback(body: GitHubCallbackRequest, db: Session = Depends(get_db)):
    """Exchange the GitHub OAuth code for a JWT token."""
    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(status_code=503, detail="GITHUB_OAUTH_NOT_CONFIGURED")

    # 1. Exchange code → GitHub access token
    try:
        token_resp = httpx.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": body.code,
                "redirect_uri": settings.github_redirect_uri,
            },
            headers={"Accept": "application/json"},
            timeout=10.0,
        )
        token_resp.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="GitHub token exchange failed")

    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Invalid GitHub OAuth code")

    gh_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    # 2. Fetch GitHub user profile
    try:
        user_resp = httpx.get(GITHUB_USER_URL, headers=gh_headers, timeout=10.0)
        user_resp.raise_for_status()
        gh_user = user_resp.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="GitHub user fetch failed")

    github_id = str(gh_user.get("id", ""))
    if not github_id:
        raise HTTPException(status_code=400, detail="Could not get GitHub user ID")

    # 3. Resolve primary email (may not be in profile if private)
    email: str | None = gh_user.get("email")
    if not email:
        try:
            emails_resp = httpx.get(GITHUB_EMAILS_URL, headers=gh_headers, timeout=10.0)
            emails_resp.raise_for_status()
            for entry in emails_resp.json():
                if entry.get("primary") and entry.get("verified"):
                    email = entry["email"]
                    break
        except httpx.HTTPError:
            pass

    if not email:
        raise HTTPException(
            status_code=400,
            detail="No verified email on your GitHub account. Please add one.",
        )

    # 4. Find existing user
    # Priority: match by github_id → match by email (link account) → needs signup
    user: User | None = db.query(User).filter(User.github_id == github_id).first()

    if user is None and email:
        # Link existing email-registered account
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.github_id = github_id
            db.commit()

    if user is None:
        # Brand-new GitHub user — redirect to signup wizard to collect profile data.
        # The frontend will store these values in sessionStorage and redirect to /register.
        name = gh_user.get("name") or gh_user.get("login") or "GitHub User"
        return {
            "needs_signup": True,
            "email": email,
            "name": name,
            "github_id": github_id,
        }

    jwt = create_access_token({"sub": user.email})
    return {"access_token": jwt, "token_type": "bearer"}
