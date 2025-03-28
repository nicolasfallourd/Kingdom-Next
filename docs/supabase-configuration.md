# Kingdom-Next Supabase Configuration

This document contains all the important information about the Supabase configuration for the Kingdom-Next game.

## Connection Details

- **Supabase URL**: `https://iajhforizmdqzyzvfiqu.supabase.co`
- **Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhamhmb3Jpem1kcXp5enZmaXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTY1NTcsImV4cCI6MjA1ODczMjU1N30.byoiCHewRowAHIq5toIGMuxrdgB5ojVc_dDzqdp7txI`

## Database Tables

### 1. game_states

**Structure:**
- `id` UUID PRIMARY KEY
- `username` TEXT
- `army` JSONB
- `created_at` TIMESTAMPTZ
- `kingdom_name` TEXT
- `resources` JSONB
- `buildings` JSONB
- `last_resource_collection` TIMESTAMPTZ

**RLS Policies:**
- SELECT (Anyone can view all game states): `true`
- SELECT (Users can view their own game state): `auth.uid() = id`
- INSERT (Users can insert their own game state): `auth.uid() = id`
- UPDATE (Users can update their own game state): `auth.uid() = id`
- DELETE (Users can delete their own game state): `auth.uid() = id`

### 2. war_reports

**Structure:**
- `id` UUID PRIMARY KEY
- `username` TEXT
- `report` JSONB
- `created_at` TIMESTAMPTZ
- `attacker_id` UUID
- `defender_id` UUID
- `victory` BOOLEAN

**RLS Policies:**
- SELECT (Anyone can view all war reports): `true`
- SELECT (Users can view their own war reports): `auth.uid() = attacker_id OR auth.uid() = defender_id`
- INSERT (Users can insert their own war reports): `auth.uid() = attacker_id`
- INSERT (Users can insert war reports they're involved in): `auth.uid() = attacker_id OR auth.uid() = defender_id`
- UPDATE (Users can update war reports they're involved in): `auth.uid() = attacker_id OR auth.uid() = defender_id`
- DELETE (Users can delete war reports they're involved in): `auth.uid() = attacker_id OR auth.uid() = defender_id`

### 3. users

**Structure:**
- `id` UUID PRIMARY KEY
- `username` TEXT
- `password` TEXT
- `created_at` TIMESTAMPTZ

**RLS Policies:**
- SELECT (Users can view their own data): `auth.uid() = id`
- INSERT (Users can insert their own data): `auth.uid() = id`

## Important Notes

1. **CORS Handling**:
   - Supabase handles CORS automatically when using the official client libraries
   - No need to manually configure "Allowed Origins" in the Supabase dashboard
   - The project uses `@supabase/supabase-js` which handles CORS automatically

2. **Timeout Configuration**:
   - The Supabase client is configured with a 10-second timeout
   - This is implemented in `lib/supabase.js` using the custom fetch option

3. **Error Handling**:
   - The game implements a `safeSupabaseOperation` function in `contexts/GameContext.js`
   - This provides fallback mechanisms for database operations
   - Ensures the game can continue even when database operations fail

4. **World Map Functionality**:
   - The "Anyone can view all game states" policy is essential for the world map
   - This allows players to see other kingdoms on the map

5. **War Reports**:
   - The war_reports table exists and is properly configured
   - It stores battle outcomes between kingdoms
   - Policies ensure players can only modify reports they're involved in
