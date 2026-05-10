from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List
from uuid import UUID

from database import get_supabase
from schemas import UserSettingsResponse, UserSettingsBase

router = APIRouter(tags=["Settings"])

@router.get("/{user_id}", response_model=UserSettingsResponse)
async def get_user_settings(user_id: UUID, db: Client = Depends(get_supabase)):
    response = db.table("user_settings").select("*").eq("user_id", str(user_id)).execute()
    if not response.data:
        # Return defaults if not found
        return {
            "user_id": user_id,
            "theme": "dark",
            "default_stake": 100,
            "currency": "INR",
            "notifications_enabled": True
        }
    return response.data[0]

@router.put("/{user_id}", response_model=UserSettingsResponse)
async def update_user_settings(user_id: UUID, settings: UserSettingsBase, db: Client = Depends(get_supabase)):
    response = db.table("user_settings").upsert({
        "user_id": str(user_id),
        "theme": settings.theme,
        "default_stake": settings.default_stake,
        "currency": settings.currency,
        "notifications_enabled": settings.notifications_enabled
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to update settings")
    return response.data[0]
