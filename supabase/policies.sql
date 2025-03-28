-- Kingdom-Next Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Game States Policies
-- Anyone can view all game states (for kingdom listing)
CREATE POLICY "Anyone can view all game states" 
  ON game_states FOR SELECT 
  USING (true);

-- Users can view their own game state
CREATE POLICY "Users can view their own game state" 
  ON game_states FOR SELECT 
  USING (auth.uid() = id);

-- Users can insert their own game state
CREATE POLICY "Users can insert their own game state" 
  ON game_states FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Users can update their own game state
CREATE POLICY "Users can update their own game state" 
  ON game_states FOR UPDATE 
  USING (auth.uid() = id);

-- Users can delete their own game state
CREATE POLICY "Users can delete their own game state" 
  ON game_states FOR DELETE 
  USING (auth.uid() = id);

-- War Reports Policies
-- Anyone can view all war reports
CREATE POLICY "Anyone can view all war reports" 
  ON war_reports FOR SELECT 
  USING (true);

-- Users can view their own war reports
CREATE POLICY "Users can view their own war reports" 
  ON war_reports FOR SELECT 
  USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Users can insert war reports they initiated
CREATE POLICY "Users can insert war reports they initiated" 
  ON war_reports FOR INSERT 
  WITH CHECK (auth.uid() = attacker_id);

-- Users can insert war reports they're involved in
CREATE POLICY "Users can insert war reports they're involved in" 
  ON war_reports FOR INSERT 
  WITH CHECK (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Users can update war reports they're involved in
CREATE POLICY "Users can update war reports they're involved in" 
  ON war_reports FOR UPDATE 
  USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Users can delete war reports they're involved in
CREATE POLICY "Users can delete war reports they're involved in" 
  ON war_reports FOR DELETE 
  USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Users Table Policies
-- Users can view their own data
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Users can insert their own data
CREATE POLICY "Users can insert their own data" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);
