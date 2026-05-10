from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List
from uuid import UUID

from database import get_supabase
from schemas import BettingHistoryResponse, BettingHistoryCreate

router = APIRouter(tags=["History"])

@router.get("/{user_id}", response_model=List[BettingHistoryResponse])
async def get_betting_history(user_id: UUID, db: Client = Depends(get_supabase)):
    response = db.table("betting_history").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
    return response.data

@router.post("/", response_model=BettingHistoryResponse)
async def create_bet(bet: BettingHistoryCreate, db: Client = Depends(get_supabase)):
    response = db.table("betting_history").insert({
        "user_id": str(bet.user_id),
        "match_id": str(bet.match_id),
        "stake": bet.stake,
        "odds": bet.odds,
        "type": bet.type,
        "status": "pending"
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to place bet")
    return response.data[0]
