// Debug utility for Kingdom-Next
const DEBUG = true;

export const debug = {
  log: (area, message, data = null) => {
    if (!DEBUG) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${area}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  },
  
  error: (area, message, error = null) => {
    if (!DEBUG) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${area}][ERROR]`;
    
    if (error) {
      console.error(`${prefix} ${message}`, error);
      
      // Log additional error details if available
      if (error.message) console.error(`${prefix} Message:`, error.message);
      if (error.code) console.error(`${prefix} Code:`, error.code);
      if (error.details) console.error(`${prefix} Details:`, error.details);
      if (error.hint) console.error(`${prefix} Hint:`, error.hint);
    } else {
      console.error(`${prefix} ${message}`);
    }
  },
  
  warn: (area, message, data = null) => {
    if (!DEBUG) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `${timestamp}][${area}][WARN]`;
    
    if (data) {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  },
  
  // Add a global error handler to catch unhandled errors
  setupGlobalErrorHandling: () => {
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        debug.error('GLOBAL', 'Unhandled error', { message, source, lineno, colno, error });
        return false;
      };
      
      window.addEventListener('unhandledrejection', (event) => {
        debug.error('GLOBAL', 'Unhandled promise rejection', event.reason);
      });
    }
  }
};

// Supabase database schema information
export const supabaseSchema = {
  game_states: {
    id: 'uuid (primary key)',
    username: 'text',
    kingdom_name: 'text',
    resources: 'jsonb - { gold, food, wood, stone }',
    buildings: 'jsonb - { castle: { level, defense_bonus }, barracks: { level, training_speed }, farm: { level, food_production }, mine: { level, gold_production } }',
    army: 'jsonb - { swordsmen, archers, cavalry, catapults }',
    last_resource_collection: 'timestamptz',
    created_at: 'timestamptz'
  },
  war_reports: {
    id: 'uuid (primary key)',
    attacker_id: 'uuid (foreign key to game_states.id)',
    defender_id: 'uuid (foreign key to game_states.id)',
    victory: 'boolean',
    report: 'jsonb - contains battle details',
    created_at: 'timestamptz'
  }
};
