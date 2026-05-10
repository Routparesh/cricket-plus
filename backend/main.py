from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="CricketPulse API",
    description="AI Cricket Betting Analytics API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CricketPulse API online", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Routers
from routers import bankroll, settings, history, tipper, matches

app.include_router(bankroll.router, prefix="/api/v1/bankroll")
app.include_router(settings.router, prefix="/api/v1/settings")
app.include_router(history.router, prefix="/api/v1/history")
app.include_router(tipper.router,  prefix="/api/v1/tipper")
app.include_router(matches.router, prefix="/api/v1/matches")
