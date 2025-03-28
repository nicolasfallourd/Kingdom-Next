# Supabase Configuration for Kingdom-Next

This directory contains documentation for the Supabase setup used in the Kingdom-Next game.

## Environment Variables

Make sure these environment variables are set in your Vercel deployment:

```
NEXT_PUBLIC_SUPABASE_URL=https://iajhforizmdqzyzvfiqu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Schema

The game uses three main tables:

1. **game_states** - Stores the player's kingdom data including resources, buildings, and army
2. **war_reports** - Records battle outcomes between kingdoms
3. **users** - Custom user data (if not using Supabase Auth directly)

See [tables.sql](./tables.sql) for the complete schema.

## Row Level Security (RLS)

Row Level Security is enabled on all tables to ensure users can only access their own data. The policies are:

- Users can only view, modify, and delete their own game state
- Users can only view war reports they're involved in
- Users can only create war reports for battles they initiated

See [policies.sql](./policies.sql) for the complete RLS configuration.

## Debugging Supabase Issues

If you encounter issues with Supabase:

1. Check the browser console for detailed error logs
2. Verify RLS policies in the Supabase dashboard
3. Use the testSupabase() function to check connectivity
4. Review the Supabase logs in the dashboard

## Timeouts and Error Handling

The Supabase client is configured with:
- 10-second timeout for fetch operations
- Detailed error logging
- Automatic session refresh

## Recommended Development Workflow

1. Make schema changes in the Supabase dashboard
2. Update the tables.sql file in this directory
3. Test RLS policies thoroughly before deployment
4. Use the debug logs to identify any issues
