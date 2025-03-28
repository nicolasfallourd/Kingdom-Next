-- Kingdom-Next Database Schema

-- Game States Table
CREATE TABLE game_states (
  id UUID PRIMARY KEY,
  username TEXT,
  army JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  kingdom_name TEXT,
  resources JSONB,
  buildings JSONB,
  last_resource_collection TIMESTAMPTZ
);

-- War Reports Table
CREATE TABLE war_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT,
  report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attacker_id UUID REFERENCES game_states(id),
  defender_id UUID REFERENCES game_states(id),
  victory BOOLEAN
);

-- Users Table (if using custom auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
