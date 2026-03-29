from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- User schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True  # lets Pydantic read SQLAlchemy objects


# --- Note schemas ---
class NoteCreate(BaseModel):
    title: str
    content: str

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Auth schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

# The above code defines Pydantic models (schemas) for the User and Note entities, as well as for authentication tokens.
# The UserCreate schema is used for creating new users, while UserResponse is used for returning user data in API responses.
# The NoteCreate schema is used for creating new notes, while NoteResponse is used for returning
