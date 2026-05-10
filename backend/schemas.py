from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class BankrollBase(BaseModel):
    total_balance: float
    risk_level: str
    daily_loss_limit: float
    stop_loss: float

class BankrollCreate(BankrollBase):
    user_id: UUID

class BankrollResponse(BankrollBase):
    id: UUID
    user_id: UUID
    updated_at: datetime

class UserSettingsBase(BaseModel):
    theme: str
    default_stake: float
    currency: str
    notifications_enabled: bool

class UserSettingsResponse(UserSettingsBase):
    user_id: UUID

class BettingHistoryBase(BaseModel):
    match_id: UUID
    stake: float
    odds: float
    type: str

class BettingHistoryCreate(BettingHistoryBase):
    user_id: UUID

class BettingHistoryResponse(BettingHistoryBase):
    id: UUID
    user_id: UUID
    status: str
    pnl: Optional[float] = None
    created_at: datetime
