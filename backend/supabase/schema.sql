-- Supabase Schema for CricketPulse

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'completed', 'abandoned');
CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'cashed_out');
CREATE TYPE alert_type AS ENUM ('entry', 'exit', 'warning', 'info');

-- 2. Users Extended Profile (Links to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Settings
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  default_stake DECIMAL DEFAULT 100,
  currency TEXT DEFAULT 'INR',
  notifications_enabled BOOLEAN DEFAULT true
);

-- 4. Bankrolls
CREATE TABLE public.bankrolls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_balance DECIMAL DEFAULT 0,
  risk_level TEXT DEFAULT 'medium',
  daily_loss_limit DECIMAL DEFAULT 1000,
  stop_loss DECIMAL DEFAULT 5000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Matches
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_api_id TEXT UNIQUE,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  venue TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  status match_status DEFAULT 'upcoming',
  format TEXT, -- T20, ODI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Live Scores
CREATE TABLE public.live_scores (
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE PRIMARY KEY,
  current_score TEXT,
  overs DECIMAL,
  wickets INTEGER,
  required_run_rate DECIMAL,
  momentum_score DECIMAL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Odds Data
CREATE TABLE public.odds_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  bookmaker TEXT,
  team_a_odds DECIMAL,
  team_b_odds DECIMAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Predictions
CREATE TABLE public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  team_a_prob DECIMAL,
  team_b_prob DECIMAL,
  confidence_score DECIMAL,
  projected_score INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AI Alerts
CREATE TABLE public.ai_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  type alert_type,
  message TEXT,
  suggested_stake DECIMAL,
  risk_level TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Betting History
CREATE TABLE public.betting_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id),
  stake DECIMAL NOT NULL,
  odds DECIMAL NOT NULL,
  type TEXT, -- e.g., 'match_winner', 'top_batsman'
  status bet_status DEFAULT 'pending',
  pnl DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bankrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Settings & Bankroll: Users can CRUD their own
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own bankroll" ON public.bankrolls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own bankroll" ON public.bankrolls FOR UPDATE USING (auth.uid() = user_id);

-- Betting History: Users can manage their own
CREATE POLICY "Users can view own bets" ON public.betting_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bets" ON public.betting_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches, Scores, Odds, Predictions, Alerts: Public read access
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Anyone can view live_scores" ON public.live_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can view odds_data" ON public.odds_data FOR SELECT USING (true);
CREATE POLICY "Anyone can view predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Anyone can view ai_alerts" ON public.ai_alerts FOR SELECT USING (true);
