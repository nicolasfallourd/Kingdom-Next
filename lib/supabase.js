import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iajhforizmdqzyzvfiqu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhamhmb3Jpem1kcXp5enZmaXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTY1NTcsImV4cCI6MjA1ODczMjU1N30.byoiCHewRowAHIq5toIGMuxrdgB5ojVc_dDzqdp7txI';

// Log Supabase configuration
console.log('*** KINGDOM DEBUG: Supabase Configuration ***');
console.log('URL:', supabaseUrl);
console.log('Key starts with:', supabaseAnonKey.substring(0, 10) + '...');

// Create Supabase client with custom fetch options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      // Log the request URL
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      console.log('*** KINGDOM DEBUG: Supabase fetch request ***', url);
      
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const options = args[1] || {};
      options.signal = controller.signal;
      
      return fetch(args[0], options)
        .then(response => {
          clearTimeout(timeoutId);
          console.log('*** KINGDOM DEBUG: Supabase fetch response ***', {
            url: url,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('*** KINGDOM DEBUG: Supabase fetch error ***', {
            url: url,
            error: error.message,
            type: error.name
          });
          throw error;
        });
    }
  }
});

// Test Supabase connection and log the result
export async function testSupabaseConnection() {
  console.log('*** KINGDOM DEBUG: Testing Supabase connection ***');
  
  try {
    console.log('*** KINGDOM DEBUG: Testing Supabase connection explicitly ***');
    
    // First, test basic connectivity to the Supabase URL
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        }
      });
      
      console.log('*** KINGDOM DEBUG: Supabase API connectivity test ***', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        console.error('*** KINGDOM DEBUG: Supabase API connectivity failed ***');
        return {
          success: false,
          message: `Supabase API connectivity failed: ${response.status} ${response.statusText}`,
          details: {
            url: supabaseUrl,
            status: response.status,
            statusText: response.statusText
          }
        };
      }
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Supabase API connectivity error ***', error);
      return {
        success: false,
        message: `Supabase API connectivity error: ${error.message}`,
        details: {
          url: supabaseUrl,
          error: error.message,
          type: error.name
        }
      };
    }
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('*** KINGDOM DEBUG: Supabase auth test failed ***', authError);
      return {
        success: false,
        message: `Authentication failed: ${authError.message}`,
        details: authError
      };
    }
    
    console.log('*** KINGDOM DEBUG: Supabase auth test result ***', {
      success: true,
      hasSession: !!authData.session
    });
    
    // Test database access
    const { data: dbData, error: dbError } = await supabase
      .from('game_states')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.error('*** KINGDOM DEBUG: Supabase database test failed ***', dbError);
      return {
        success: false,
        message: `Database access failed: ${dbError.message}`,
        details: dbError
      };
    }
    
    console.log('*** KINGDOM DEBUG: Supabase database test result ***', {
      success: true,
      data: dbData
    });
    
    return {
      success: true,
      message: 'Supabase connection successful',
      details: {
        hasSession: !!authData.session,
        databaseAccessible: true
      }
    };
  } catch (error) {
    console.error('*** KINGDOM DEBUG: Supabase connection test error ***', error);
    return {
      success: false,
      message: `Connection test error: ${error.message}`,
      details: error
    };
  }
}

// Comprehensive diagnostic test for Supabase
export async function diagnoseDatabaseIssues() {
  console.log('*** KINGDOM DEBUG: Running database diagnostics ***');
  
  const results = {
    connectivity: null,
    authentication: null,
    database: null,
    tables: null,
    recommendations: []
  };
  
  try {
    // 1. Test basic connectivity
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        }
      });
      
      results.connectivity = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
      
      if (!response.ok) {
        results.recommendations.push(
          'Supabase project may be offline or URL is incorrect. Check your project status in the Supabase dashboard.'
        );
      }
    } catch (error) {
      results.connectivity = {
        success: false,
        error: error.message
      };
      
      results.recommendations.push(
        'Cannot connect to Supabase. Check your internet connection and Supabase URL.'
      );
    }
    
    // 2. Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    results.authentication = {
      success: !authError,
      hasSession: !!authData?.session,
      error: authError ? authError.message : null
    };
    
    if (authError) {
      results.recommendations.push(
        'Authentication failed. Check your Supabase anon key and make sure it has not expired.'
      );
    } else if (!authData.session) {
      results.recommendations.push(
        'No active session. Try signing out and signing back in.'
      );
    }
    
    // 3. Test database access
    const { data: dbData, error: dbError } = await supabase
      .from('game_states')
      .select('count')
      .limit(1);
    
    results.database = {
      success: !dbError,
      error: dbError ? dbError.message : null
    };
    
    if (dbError) {
      if (dbError.message.includes('does not exist')) {
        results.recommendations.push(
          'The game_states table does not exist. Make sure your database schema is set up correctly.'
        );
      } else if (dbError.message.includes('permission denied')) {
        results.recommendations.push(
          'Permission denied for game_states table. Check your Row Level Security (RLS) policies.'
        );
      } else {
        results.recommendations.push(
          `Database error: ${dbError.message}. Check your database configuration.`
        );
      }
    }
    
    // 4. Check for specific tables
    const tables = ['game_states', 'war_reports'];
    results.tables = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        results.tables[table] = {
          exists: !error || !error.message.includes('does not exist'),
          accessible: !error,
          error: error ? error.message : null
        };
        
        if (error) {
          if (error.message.includes('does not exist')) {
            results.recommendations.push(
              `The ${table} table does not exist. Run the setup script to create it.`
            );
          } else if (error.message.includes('permission denied')) {
            results.recommendations.push(
              `Permission denied for ${table} table. Check your RLS policies.`
            );
          }
        }
      } catch (error) {
        results.tables[table] = {
          exists: false,
          accessible: false,
          error: error.message
        };
      }
    }
    
    // Add general recommendations
    if (results.connectivity.success && results.authentication.success && results.database.success) {
      if (results.recommendations.length === 0) {
        results.recommendations.push(
          'All tests passed. If you are still experiencing issues, check your browser console for more detailed error messages.'
        );
      }
    } else {
      results.recommendations.push(
        'Check CORS settings in your Supabase project if accessing from a different domain.',
        'Verify that your environment variables are correctly set up.'
      );
    }
    
    console.log('*** KINGDOM DEBUG: Diagnostics results ***', results);
    return results;
  } catch (error) {
    console.error('*** KINGDOM DEBUG: Diagnostics error ***', error);
    return {
      error: error.message,
      recommendations: [
        'An unexpected error occurred during diagnostics.',
        'Check your browser console for more details.',
        'Verify that your Supabase project is online and accessible.'
      ]
    };
  }
}
