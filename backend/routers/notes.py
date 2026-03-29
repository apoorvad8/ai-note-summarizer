from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Note
from schemas import NoteCreate, NoteResponse
from dependancies import get_current_user
from models import User
from typing import List
import openai
import os

router = APIRouter(prefix="/notes", tags=["notes"])

openai.api_key = os.getenv("OPENAI_API_KEY")


# ─── Create a note ───────────────────────────────────────────
@router.post("/", response_model=NoteResponse, status_code=201)
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)   # protected!
):
    note = Note(
        title=note_data.title,
        content=note_data.content,
        user_id=current_user.id
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


# ─── Get all notes for the logged-in user ────────────────────
@router.get("/", response_model=List[NoteResponse])
def get_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notes = db.query(Note).filter(Note.user_id == current_user.id).all()
    return notes


# ─── Get a single note ───────────────────────────────────────
@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id   # users can only see their own notes
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


# ─── Delete a note ───────────────────────────────────────────
@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return


# ─── Summarize a note with OpenAI ────────────────────────────
@router.post("/{note_id}/summarize", response_model=NoteResponse)
def summarize_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Summarize the following note in 2-3 concise sentences."
                },
                {
                    "role": "user",
                    "content": note.content
                }
            ],
            max_tokens=150
        )
        summary = response.choices[0].message.content

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI error: {str(e)}"
        )

    # Save summary back to DB
    note.summary = summary
    db.commit()
    db.refresh(note)
    return note