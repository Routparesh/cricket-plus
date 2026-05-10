from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List
from uuid import UUID

from database import get_supabase
from schemas import BankrollResponse, BankrollCreate

router = APIRouter(tags=["Bankroll"])

@router.get("/{user_id}", response_model=BankrollResponse)
async def get_bankroll(user_id: UUID, db: Client = Depends(get_supabase)):
    response = db.table("bankrolls").select("*").eq("user_id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Bankroll not found")
    return response.data[0]

@router.post("/", response_model=BankrollResponse)
async def create_or_update_bankroll(bankroll: BankrollCreate, db: Client = Depends(get_supabase)):
    # Upsert logic since user_id is unique
    response = db.table("bankrolls").upsert({
        "user_id": str(bankroll.user_id),
        "total_balance": bankroll.total_balance,
        "risk_level": bankroll.risk_level,
        "daily_loss_limit": bankroll.daily_loss_limit,
        "stop_loss": bankroll.stop_loss
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to update bankroll")
    return response.data[0]
