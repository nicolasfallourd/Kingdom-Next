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
    const { data, error } = await supabase.from('game_states').select('count').limit(1);
    const endTime = Date.now();
    
    console.log('*** KINGDOM DEBUG: Supabase connection test result ***', {
      success: !error,
      data,
      error,
      timeMs: endTime - startTime
    });
    
    return { success: !error, data, error, timeMs: endTime - startTime };
  } catch (error) {
    console.error('*** KINGDOM DEBUG: Supabase connection test exception ***', error);
    return { success: false, error: error.message };
  }
};
