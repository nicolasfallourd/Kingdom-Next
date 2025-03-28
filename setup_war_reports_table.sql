-- Create the war_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS war_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attacker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  defender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  victory BOOLEAN NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for the war_reports table

-- Enable RLS on the table
ALTER TABLE war_reports ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy
CREATE POLICY "Users can insert war reports they're involved in" 
ON war_reports FOR INSERT 
WITH CHECK (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Create SELECT policy
CREATE POLICY "Anyone can view all war reports" 
ON war_reports FOR SELECT 
USING (true);

-- Create UPDATE policy
CREATE POLICY "Users can update war reports they're involved in" 
ON war_reports FOR UPDATE 
USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Create DELETE policy
CREATE POLICY "Users can delete war reports they're involved in" 
ON war_reports FOR DELETE 
USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS war_reports_attacker_id_idx ON war_reports(attacker_id);
CREATE INDEX IF NOT EXISTS war_reports_defender_id_idx ON war_reports(defender_id);
