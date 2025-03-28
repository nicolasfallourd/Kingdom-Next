import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iajhforizmdqzyzvfiqu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhamhmb3Jpem1kcXp5enZmaXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTY1NTcsImV4cCI6MjA1ODczMjU1N30.byoiCHewRowAHIq5toIGMuxrdgB5ojVc_dDzqdp7txI';

// Create Supabase client with custom fetch options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      console.log('*** KINGDOM DEBUG: Supabase fetch request ***', args[0]);
      return fetch(...args)
        .then(response => {
          console.log('*** KINGDOM DEBUG: Supabase fetch response ***', {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          return response;
        })
        .catch(error => {
          console.error('*** KINGDOM DEBUG: Supabase fetch error ***', {
            url: args[0],
            error: error.message
          });
          throw error;
        });
    }
  }
});

// Test Supabase connection and log the result
export const testSupabaseConnection = async () => {
  console.log('*** KINGDOM DEBUG: Testing Supabase connection explicitly ***');
  try {
    const startTime = Date.now();
    
    // Try a simple health check query first
    const { data: healthData, error: healthError } = await supabase.rpc('get_service_status');
    
    if (!healthError && healthData) {
      console.log('*** KINGDOM DEBUG: Supabase health check successful ***', healthData);
    } else {
      console.log('*** KINGDOM DEBUG: Supabase health check failed, trying table query ***');
      
      // Fall back to a simple table query
      const { data, error } = await supabase
        .from('game_states')
        .select('count')
        .limit(1);
      
      const endTime = Date.now();
      
      console.log('*** KINGDOM DEBUG: Supabase connection test result ***', {
        success: !error,
        data,
        error,
        timeMs: endTime - startTime
      });
      
      return { success: !error, data, error, timeMs: endTime - startTime };
    }
    
    const endTime = Date.now();
    return { success: true, data: healthData, timeMs: endTime - startTime };
  } catch (error) {
    console.error('*** KINGDOM DEBUG: Supabase connection test exception ***', error);
    return { success: false, error: error.message };
  }
};

// Comprehensive diagnostic test for Supabase
export const diagnoseDatabaseIssues = async () => {
  console.log('*** KINGDOM DEBUG: Running comprehensive Supabase diagnostics ***');
  const results = {
    connectivity: null,
    authentication: null,
    tables: {},
    schema: {},
    recommendations: []
  };
  
  try {
    // 1. Basic connectivity test
    try {
      const response = await fetch(supabaseUrl);
      results.connectivity = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
      
      if (!response.ok) {
        results.recommendations.push('The Supabase project URL is not reachable. Check if your project is active in the Supabase dashboard.');
      }
    } catch (error) {
      results.connectivity = {
        success: false,
        error: error.message
      };
      results.recommendations.push('Network connectivity issue. Check your internet connection or if the Supabase URL is correct.');
    }
    
    // 2. Authentication test
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      results.authentication = {
        success: !authError,
        hasSession: !!authData?.session,
        error: authError
      };
      
      if (authError) {
        results.recommendations.push('Authentication error. Your anon key might be invalid or expired. Check your API keys in the Supabase dashboard.');
      } else if (!authData?.session) {
        results.recommendations.push('No active session. Try logging in again.');
      }
    } catch (error) {
      results.authentication = {
        success: false,
        error: error.message
      };
      results.recommendations.push('Authentication system error. Your Supabase client might be misconfigured.');
    }
    
    // 3. Table access tests
    const tablesToCheck = ['game_states', 'war_reports'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
          
        results.tables[table] = {
          success: !error,
          error: error
        };
        
        if (error) {
          if (error.code === '42P01') {
            results.recommendations.push(`Table "${table}" doesn't exist. Check if the table name is correct or if you need to create it.`);
          } else if (error.code === '42501') {
            results.recommendations.push(`Permission denied for table "${table}". Check your Row Level Security (RLS) policies.`);
          } else {
            results.recommendations.push(`Error accessing table "${table}": ${error.message}`);
          }
        }
      } catch (error) {
        results.tables[table] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // 4. Schema check for game_states
    if (results.tables['game_states']?.success) {
      try {
        const { data, error } = await supabase
          .from('game_states')
          .select('*')
          .limit(1);
          
        if (!error && data && data.length > 0) {
          const sampleRecord = data[0];
          const expectedFields = ['id', 'kingdom_name', 'resources', 'buildings', 'army', 'last_resource_collection'];
          const missingFields = expectedFields.filter(field => !(field in sampleRecord));
          
          results.schema['game_states'] = {
            success: missingFields.length === 0,
            sampleRecord,
            missingFields
          };
          
          if (missingFields.length > 0) {
            results.recommendations.push(`Schema mismatch in "game_states" table. Missing fields: ${missingFields.join(', ')}`);
          }
        }
      } catch (error) {
        results.schema['game_states'] = {
          success: false,
          error: error.message
        };
      }
    }
    
    console.log('*** KINGDOM DEBUG: Diagnostic results ***', results);
    return results;
  } catch (error) {
    console.error('*** KINGDOM DEBUG: Diagnostic error ***', error);
    return {
      success: false,
      error: error.message,
      recommendations: ['An unexpected error occurred during diagnostics. Check the console for details.']
    };
  }
};
