import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { useRouter } from 'next/router';
import { debug, supabaseSchema } from '../lib/debug';

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [otherKingdoms, setOtherKingdoms] = useState([]);
  const [warReports, setWarReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Set up global error handling
  useEffect(() => {
    debug.setupGlobalErrorHandling();
    debug.log('GameContext', 'GameProvider initialized');
    
    // Add direct console logging for debugging
    console.log('*** KINGDOM DEBUG: GameProvider initialized ***');
  }, []);

  // Check for user session on mount
  useEffect(() => {
    debug.log('GameContext', 'Setting up auth listener');
    console.log('*** KINGDOM DEBUG: Setting up auth listener ***');
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debug.log('GameContext', `Auth state changed: ${event}`, session);
        console.log(`*** KINGDOM DEBUG: Auth state changed: ${event} ***`, session?.user?.id || 'No user');
        
        if (session) {
          setUser(session.user);
          debug.log('GameContext', 'User authenticated, fetching game state', { userId: session.user.id });
          console.log(`*** KINGDOM DEBUG: User authenticated, fetching game state for ${session.user.id} ***`);
          
          // Check if we're in emergency mode
          const bypass = localStorage.getItem('bypass_loading');
          if (bypass === 'true') {
            console.log('*** KINGDOM DEBUG: Emergency mode detected in auth listener, skipping fetchGameState ***');
            setLoading(false);
            return;
          }
          
          try {
            await fetchGameState(session.user.id);
          } catch (err) {
            console.error('*** KINGDOM DEBUG: Error in fetchGameState ***', err);
            setError(`Error fetching game state: ${err.message}`);
            setLoading(false);
          }
        } else {
          debug.log('GameContext', 'No active session, clearing user and game state');
          console.log('*** KINGDOM DEBUG: No active session, clearing user and game state ***');
          setUser(null);
          setGameState(null);
          if (router.pathname !== '/login' && router.pathname !== '/register') {
            debug.log('GameContext', 'Redirecting to login');
            console.log('*** KINGDOM DEBUG: Redirecting to login ***');
            router.push('/login');
          }
        }
        setLoading(false);
      }
    );

    // Initial session check
    checkUser();

    return () => {
      debug.log('GameContext', 'Cleaning up auth listener');
      console.log('*** KINGDOM DEBUG: Cleaning up auth listener ***');
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      console.log('*** KINGDOM DEBUG: Checking user session ***');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('*** KINGDOM DEBUG: Session error ***', sessionError);
        throw sessionError;
      }
      
      if (session) {
        console.log(`*** KINGDOM DEBUG: Session found for user ${session.user.id} ***`);
        setUser(session.user);
        debug.log('GameContext', 'User authenticated, fetching game state', { userId: session.user.id });
        
        // Check if we're in emergency mode
        const bypass = localStorage.getItem('bypass_loading');
        if (bypass === 'true') {
          console.log('*** KINGDOM DEBUG: Emergency mode detected in checkUser, skipping fetchGameState ***');
          setLoading(false);
          return;
        }
        
        try {
          await fetchGameState(session.user.id);
        } catch (error) {
          console.error('*** KINGDOM DEBUG: Error in fetchGameState during checkUser ***', error);
          setError(`Error fetching game state: ${error.message}`);
        }
      } else {
        console.log('*** KINGDOM DEBUG: No session found ***');
        debug.log('GameContext', 'No active session, clearing user and game state');
        setUser(null);
        setGameState(null);
      }
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in checkUser ***', error);
      setError(`Session error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmergencyMode() {
    try {
      console.log('*** KINGDOM DEBUG: handleEmergencyMode started ***');
      const bypass = localStorage.getItem('bypass_loading');
      if (bypass === 'true') {
        console.log('*** KINGDOM DEBUG: Emergency mode already active ***');
        return;
      }
      
      localStorage.setItem('bypass_loading', 'true');
      setLoading(false);
      console.log('*** KINGDOM DEBUG: Emergency mode activated ***');
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in handleEmergencyMode ***', error);
    }
  }

  async function fetchGameState(userId) {
    console.log('*** KINGDOM DEBUG: fetchGameState started for user:', userId, '***');
    try {
      debug.log('GameContext', 'Fetching game state for user:', userId);
      
      // Check for cached game state first
      const cachedState = localStorage.getItem(`kingdom_gamestate_${userId}`);
      if (cachedState) {
        try {
          const parsedState = JSON.parse(cachedState);
          const cacheTime = localStorage.getItem(`kingdom_gamestate_time_${userId}`);
          const cacheAge = cacheTime ? (Date.now() - parseInt(cacheTime)) / 1000 : 9999;
          
          console.log(`*** KINGDOM DEBUG: Found cached game state (${cacheAge.toFixed(1)}s old) ***`);
          
          // Use cached state while we fetch the latest in the background
          if (parsedState && Object.keys(parsedState).length > 0) {
            console.log('*** KINGDOM DEBUG: Using cached game state while fetching latest ***');
            setGameState(parsedState);
            // Don't set loading to false yet - we'll do that after the real fetch
          }
        } catch (cacheError) {
          console.error('*** KINGDOM DEBUG: Error parsing cached game state ***', cacheError);
          // Continue with normal fetch if cache parsing fails
        }
      }
      
      // Test Supabase connection first using our new explicit test function
      console.log('*** KINGDOM DEBUG: Testing Supabase connection ***');
      const connectionTest = await testSupabaseConnection();
      
      if (!connectionTest.success) {
        console.error('*** KINGDOM DEBUG: Supabase connection test failed ***', connectionTest.error);
        
        // If we have a cached state, use it and don't throw an error
        if (cachedState) {
          console.log('*** KINGDOM DEBUG: Using cached state due to connection failure ***');
          setLoading(false);
          return;
        }
        
        throw new Error(`Supabase connection error: ${connectionTest.error}`);
      }
      
      console.log('*** KINGDOM DEBUG: Supabase connection test successful ***', connectionTest);
      
      // Add a helper function for safe Supabase operations with timeout handling
      async function safeSupabaseOperation(operation, fallbackValue = null, timeoutMs = 10000) {
        try {
          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Operation timeout after ${timeoutMs}ms`));
            }, timeoutMs);
          });
          
          // Execute the operation with timeout
          const result = await Promise.race([operation(), timeoutPromise]);
          return result;
        } catch (error) {
          console.error('*** KINGDOM DEBUG: Safe operation error ***', error);
          debug.log('GameContext', 'Safe operation error:', error);
          
          // Return fallback value instead of throwing
          return fallbackValue;
        }
      }
      
      // Set a global timeout for the entire fetchGameState operation
      const globalTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          const timeoutError = new Error('Global fetchGameState timeout after 30 seconds');
          console.error('*** KINGDOM DEBUG: TIMEOUT ERROR ***', timeoutError);
          reject(timeoutError);
        }, 30000); // Increased from 15 seconds to 30 seconds
      });
      
      // Create a promise for the actual fetch operation
      const fetchOperationPromise = (async () => {
        try {
          // Fetch game state with timeout
          console.log('*** KINGDOM DEBUG: Fetching game state data ***');
          
          // Set up a timeout for the fetch operation
          const fetchWithTimeout = async () => {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Fetch game state timeout after 10 seconds')), 10000); // Increased from 5 to 10 seconds
            });
            
            const fetchPromise = supabase
              .from('game_states')
              .select('*')
              .eq('id', userId)
              .single();
              
            return Promise.race([fetchPromise, timeoutPromise]);
          };
          
          const { data: gameStateData, error: gameStateError } = await fetchWithTimeout();

          console.log('*** KINGDOM DEBUG: Game state data ***', gameStateData);
          console.log('*** KINGDOM DEBUG: Game state error ***', gameStateError);
          debug.log('GameContext', 'Game state data:', gameStateData);
          debug.log('GameContext', 'Game state error:', gameStateError);

          if (gameStateError && gameStateError.code !== 'PGRST116') {
            console.error('*** KINGDOM DEBUG: Error fetching game state ***', gameStateError);
            throw gameStateError;
          }

          // If no game state exists, create a new one
          if (!gameStateData) {
            console.log('*** KINGDOM DEBUG: No game state found, creating new one ***');
            debug.log('GameContext', 'No game state found, creating new one');
            await createNewGameState(userId);
          } else {
            console.log('*** KINGDOM DEBUG: Setting game state ***', gameStateData);
            debug.log('GameContext', 'Setting game state:', gameStateData);
            setGameState(gameStateData);
            
            // Cache the game state for future use
            try {
              localStorage.setItem(`kingdom_gamestate_${userId}`, JSON.stringify(gameStateData));
              localStorage.setItem(`kingdom_gamestate_time_${userId}`, Date.now().toString());
              console.log('*** KINGDOM DEBUG: Game state cached successfully ***');
            } catch (cacheError) {
              console.error('*** KINGDOM DEBUG: Error caching game state ***', cacheError);
              // Continue even if caching fails
            }
          }

          // Fetch other kingdoms
          console.log('*** KINGDOM DEBUG: Fetching other kingdoms ***');
          debug.log('GameContext', 'Fetching other kingdoms');
          
          // Log the current user ID for debugging
          console.log('*** KINGDOM DEBUG: Current user ID for other kingdoms query ***', userId);
          
          try {
            // First check how many total game states exist
            const { data: totalCount, error: countError } = await supabase
              .from('game_states')
              .select('id', { count: 'exact', head: true });
              
            console.log('*** KINGDOM DEBUG: Total game states count ***', totalCount);
            
            if (countError) {
              console.error('*** KINGDOM DEBUG: Error counting game states ***', countError);
            }
            
            // Now fetch other kingdoms
            const { data: kingdoms, error: kingdomsError } = await supabase
              .from('game_states')
              .select('id, kingdom_name, buildings, army')
              .neq('id', userId)
              .limit(10);

            console.log('*** KINGDOM DEBUG: Other kingdoms query ***', {
              query: `FROM game_states SELECT id, kingdom_name, buildings, army WHERE id != ${userId} LIMIT 10`,
              results: kingdoms ? kingdoms.length : 0
            });
            console.log('*** KINGDOM DEBUG: Other kingdoms ***', kingdoms);
            console.log('*** KINGDOM DEBUG: Kingdoms error ***', kingdomsError);
            debug.log('GameContext', 'Other kingdoms:', kingdoms);
            debug.log('GameContext', 'Kingdoms error:', kingdomsError);

            if (kingdomsError) {
              console.error('*** KINGDOM DEBUG: Error fetching other kingdoms ***', kingdomsError);
              throw kingdomsError;
            }
            
            setOtherKingdoms(kingdoms || []);
          } catch (error) {
            console.error('*** KINGDOM DEBUG: Exception in other kingdoms fetch ***', error);
            // Don't throw here, just log the error and continue
            setOtherKingdoms([]);
          }

          // Fetch war reports
          console.log('*** KINGDOM DEBUG: Fetching war reports ***');
          debug.log('GameContext', 'Fetching war reports');
          try {
            const { data: reports, error: reportsError } = await supabase
              .from('war_reports')
              .select('*')
              .or(`attacker_id.eq.${userId},defender_id.eq.${userId}`)
              .order('created_at', { ascending: false })
              .limit(10);

            console.log('*** KINGDOM DEBUG: War reports ***', reports);
            console.log('*** KINGDOM DEBUG: Reports error ***', reportsError);
            debug.log('GameContext', 'War reports:', reports);
            debug.log('GameContext', 'Reports error:', reportsError);

            if (reportsError) {
              console.error('*** KINGDOM DEBUG: Error fetching war reports ***', reportsError);
              throw reportsError;
            }
            
            setWarReports(reports || []);
          } catch (error) {
            console.error('*** KINGDOM DEBUG: Exception in war reports fetch ***', error);
            // Don't throw here, just log the error and continue
            setWarReports([]);
          }
          
          console.log('*** KINGDOM DEBUG: Game data fetching complete ***');
          debug.log('GameContext', 'Game data fetching complete');
          
          // Explicitly set loading to false here to ensure we exit the loading state
          setLoading(false);
          
          return true; // Signal successful completion
        } catch (error) {
          console.error('*** KINGDOM DEBUG: Error in fetchGameState inner try/catch ***', error);
          throw error;
        }
      })();
      
      // Race the fetch operation against the global timeout
      try {
        await Promise.race([fetchOperationPromise, globalTimeoutPromise]);
      } catch (raceError) {
        console.error('*** KINGDOM DEBUG: Race error in fetchGameState ***', raceError);
        
        // If we get a timeout, try to recover by setting loading to false
        if (raceError.message.includes('timeout')) {
          console.log('*** KINGDOM DEBUG: Timeout detected, attempting recovery ***');
          setLoading(false);
          
          // Create a minimal game state to prevent getting stuck
          if (!gameState) {
            console.log('*** KINGDOM DEBUG: Creating emergency minimal game state due to timeout ***');
            try {
              const minimalGameState = {
                id: userId,
                kingdom_name: 'Emergency Kingdom',
                resources: { gold: 1000, food: 500, wood: 300, stone: 200 },
                buildings: { castle: { level: 1 } },
                army: { swordsmen: 10 },
                last_resource_collection: new Date().toISOString()
              };
              setGameState(minimalGameState);
              
              // Set emergency mode flag
              localStorage.setItem('bypass_loading', 'true');
              console.log('*** KINGDOM DEBUG: Emergency mode activated due to timeout ***');
            } catch (emergencyError) {
              console.error('*** KINGDOM DEBUG: Failed to create emergency game state ***', emergencyError);
            }
          }
        }
        
        throw raceError;
      }

    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in fetchGameState ***', error);
      console.error('Error fetching game data:', error);
      setError(`Failed to fetch game data: ${error.message}`);
      
      // Force loading to false even if there's an error
      setLoading(false);
      
      // Create a minimal game state to prevent getting stuck
      if (!gameState) {
        console.log('*** KINGDOM DEBUG: Creating emergency minimal game state due to error ***');
        try {
          const minimalGameState = {
            id: userId,
            kingdom_name: 'Emergency Kingdom',
            resources: { gold: 1000, food: 500, wood: 300, stone: 200 },
            buildings: { castle: { level: 1 } },
            army: { swordsmen: 10 },
            last_resource_collection: new Date().toISOString()
          };
          setGameState(minimalGameState);
        } catch (emergencyError) {
          console.error('*** KINGDOM DEBUG: Failed to create emergency game state ***', emergencyError);
        }
      }
      
      throw error;
    }
  }

  async function createNewGameState(userId) {
    try {
      console.log('*** KINGDOM DEBUG: createNewGameState started for user:', userId, '***');
      debug.log('GameContext', 'Creating new game state for user:', userId);
      // Get user metadata for username
      const { data: { user } } = await supabase.auth.getUser();
      const username = user?.user_metadata?.username || 'Kingdom';
      console.log('*** KINGDOM DEBUG: Username ***', username);
      debug.log('GameContext', 'Username:', username);

      const newGameState = {
        id: userId,
        username: username, 
        kingdom_name: `${username}'s Realm`,
        resources: {
          gold: 1000,
          food: 500,
          wood: 300,
          stone: 200
        },
        buildings: {
          castle: { level: 1, defense_bonus: 10 },
          barracks: { level: 1, training_speed: 1 },
          farm: { level: 1, food_production: 10 },
          mine: { level: 1, gold_production: 5 }
        },
        army: {
          swordsmen: 10,
          archers: 5,
          cavalry: 0,
          catapults: 0
        },
        last_resource_collection: new Date().toISOString()
      };

      console.log('*** KINGDOM DEBUG: New game state to insert ***', newGameState);
      debug.log('GameContext', 'New game state to insert:', newGameState);
      const { data, error } = await supabase
        .from('game_states')
        .insert(newGameState)
        .select()
        .single();

      console.log('*** KINGDOM DEBUG: Insert result data ***', data);
      console.log('*** KINGDOM DEBUG: Insert error ***', error);
      debug.log('GameContext', 'Insert result data:', data);
      debug.log('GameContext', 'Insert error:', error);

      if (error) {
        console.error('*** KINGDOM DEBUG: Error creating new game state ***', error);
        throw error;
      }

      setGameState(data);
      console.log('*** KINGDOM DEBUG: Game state created and set successfully ***');
      debug.log('GameContext', 'Game state created and set successfully');
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in createNewGameState ***', error);
      console.error('Error creating new game state:', error);
      setError(`Failed to create new game state: ${error.message}`);
    }
  }

  async function updateGameState(newState) {
    try {
      console.log('*** KINGDOM DEBUG: updateGameState started ***');
      
      // Cache the new state immediately to ensure UI responsiveness
      setGameState(newState);
      
      // Store in localStorage as a backup
      try {
        localStorage.setItem(`kingdom_gamestate_${user.id}`, JSON.stringify(newState));
        localStorage.setItem(`kingdom_gamestate_time_${user.id}`, Date.now().toString());
        console.log('*** KINGDOM DEBUG: Game state cached in localStorage during update ***');
      } catch (cacheError) {
        console.error('*** KINGDOM DEBUG: Error caching game state during update ***', cacheError);
        // Continue even if caching fails
      }
      
      // Queue the update in localStorage in case the operation fails
      try {
        const pendingUpdates = JSON.parse(localStorage.getItem('kingdom_pending_updates') || '[]');
        pendingUpdates.push({
          id: user.id,
          state: newState,
          timestamp: Date.now()
        });
        localStorage.setItem('kingdom_pending_updates', JSON.stringify(pendingUpdates));
        console.log('*** KINGDOM DEBUG: Update queued in pending updates ***');
      } catch (queueError) {
        console.error('*** KINGDOM DEBUG: Error queueing update ***', queueError);
      }
      
      // Use safeSupabaseOperation with timeout handling
      const { error } = await safeSupabaseOperation(
        () => supabase
          .from('game_states')
          .update(newState)
          .eq('id', user.id),
        { error: new Error('Update operation timed out') },
        15000 // 15 second timeout for update operations
      );

      if (error) {
        console.error('*** KINGDOM DEBUG: Error updating game state ***', error);
        
        // Don't throw here - we've already updated the local state and queued the update
        console.log('*** KINGDOM DEBUG: Using local state due to update failure ***');
        
        // Mark that we have pending updates to retry later
        localStorage.setItem('kingdom_has_pending_updates', 'true');
        
        // Still set the error for debugging purposes, but with a more friendly message
        setError(`Playing in offline mode. Your changes will be saved when connection is restored.`);
        return;
      }
      
      // Update successful, remove this update from the pending queue
      try {
        const pendingUpdates = JSON.parse(localStorage.getItem('kingdom_pending_updates') || '[]');
        const filteredUpdates = pendingUpdates.filter(update => 
          update.id !== user.id || 
          JSON.stringify(update.state) !== JSON.stringify(newState)
        );
        localStorage.setItem('kingdom_pending_updates', JSON.stringify(filteredUpdates));
        
        if (filteredUpdates.length === 0) {
          localStorage.removeItem('kingdom_has_pending_updates');
        }
        
        console.log('*** KINGDOM DEBUG: Update removed from pending queue ***');
      } catch (queueError) {
        console.error('*** KINGDOM DEBUG: Error managing pending updates queue ***', queueError);
      }
      
      console.log('*** KINGDOM DEBUG: Game state updated successfully ***');
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error in updateGameState ***', error);
      console.error('Error updating game state:', error);
      setError(`Failed to update game state: ${error.message}`);
      
      // We've already updated the local state, so no need to throw
    }
  }

  async function attackKingdom(targetKingdomId) {
    try {
      console.log('*** KINGDOM DEBUG: attackKingdom started ***');
      debug.log('GameContext', 'Attacking kingdom with ID:', targetKingdomId);
      
      // Validate inputs
      if (!gameState) {
        console.error('*** KINGDOM DEBUG: No game state available ***');
        throw new Error('No game state available');
      }
      
      if (!targetKingdomId) {
        console.error('*** KINGDOM DEBUG: No target kingdom ID provided ***');
        throw new Error('No target kingdom ID provided');
      }
      
      // Get target kingdom data using safeSupabaseOperation
      const { data: targetKingdom, error: targetError } = await safeSupabaseOperation(
        () => supabase
          .from('game_states')
          .select('*')
          .eq('id', targetKingdomId)
          .single(),
        { 
          data: {
            id: targetKingdomId,
            kingdom_name: 'Unknown Kingdom',
            resources: { gold: 500, food: 300, wood: 200, stone: 100 },
            buildings: { castle: { level: 1, defense_bonus: 10 } },
            army: { swordsmen: 10, archers: 5, cavalry: 2, catapults: 0 }
          }, 
          error: null 
        }
      );

      console.log('*** KINGDOM DEBUG: Target kingdom data ***', targetKingdom);
      console.log('*** KINGDOM DEBUG: Target error ***', targetError);
      debug.log('GameContext', 'Target kingdom data:', targetKingdom);
      debug.log('GameContext', 'Target error:', targetError);

      // Continue with attack even if there was an error, using the fallback data
      if (targetError) {
        console.warn('*** KINGDOM DEBUG: Using fallback target kingdom data due to fetch error ***');
      }

      // Ensure required objects exist
      if (!gameState.army) {
        console.error('*** KINGDOM DEBUG: Attacker army is missing ***');
        throw new Error('Your army is not ready for battle');
      }

      if (!targetKingdom.army) {
        console.warn('*** KINGDOM DEBUG: Target army is missing, creating default ***');
        targetKingdom.army = { swordsmen: 10, archers: 5, cavalry: 2, catapults: 0 };
      }

      if (!targetKingdom.buildings || !targetKingdom.buildings.castle) {
        console.warn('*** KINGDOM DEBUG: Target castle is missing, assuming level 1 ***');
        targetKingdom.buildings = targetKingdom.buildings || {};
        targetKingdom.buildings.castle = { level: 1, defense_bonus: 10 };
      }

      // Calculate attack and defense power
      const attackPower = calculateArmyPower(gameState.army);
      const defensePower = calculateDefensePower(targetKingdom.army, targetKingdom.buildings.castle);
      
      console.log('*** KINGDOM DEBUG: Attack power ***', attackPower);
      console.log('*** KINGDOM DEBUG: Defense power ***', defensePower);
      debug.log('GameContext', 'Attack power:', attackPower);
      debug.log('GameContext', 'Defense power:', defensePower);

      // Determine outcome
      const ratio = attackPower / defensePower;
      const randomFactor = 0.8 + (Math.random() * 0.4); // Random factor between 0.8 and 1.2
      const adjustedRatio = ratio * randomFactor;
      
      console.log('*** KINGDOM DEBUG: Attack/Defense ratio ***', ratio);
      console.log('*** KINGDOM DEBUG: Adjusted ratio with random factor ***', adjustedRatio);
      
      const victory = adjustedRatio > 1;
      
      // Calculate losses
      let attackerLosses = {};
      let defenderLosses = {};
      let resourcesStolen = {};
      
      if (victory) {
        // Attacker wins: fewer losses for attacker, more for defender
        attackerLosses = calculateLosses(gameState.army, 0.1 + (0.2 / ratio));
        defenderLosses = calculateLosses(targetKingdom.army, 0.3 + (0.3 / ratio));
        
        // Calculate resources stolen (if target has resources)
        if (targetKingdom.resources) {
          const stealPercent = 0.2 + (0.1 * adjustedRatio);
          resourcesStolen = {
            gold: Math.floor((targetKingdom.resources.gold || 0) * stealPercent),
            food: Math.floor((targetKingdom.resources.food || 0) * stealPercent),
            wood: Math.floor((targetKingdom.resources.wood || 0) * stealPercent),
            stone: Math.floor((targetKingdom.resources.stone || 0) * stealPercent)
          };
        } else {
          resourcesStolen = { gold: 0, food: 0, wood: 0, stone: 0 };
        }
      } else {
        // Defender wins: more losses for attacker, fewer for defender
        attackerLosses = calculateLosses(gameState.army, 0.3 + (0.3 * adjustedRatio));
        defenderLosses = calculateLosses(targetKingdom.army, 0.1 + (0.1 * adjustedRatio));
        resourcesStolen = { gold: 0, food: 0, wood: 0, stone: 0 };
      }
      
      console.log('*** KINGDOM DEBUG: Attacker losses ***', attackerLosses);
      console.log('*** KINGDOM DEBUG: Defender losses ***', defenderLosses);
      console.log('*** KINGDOM DEBUG: Resources stolen ***', resourcesStolen);
      debug.log('GameContext', 'Attacker losses:', attackerLosses);
      debug.log('GameContext', 'Defender losses:', defenderLosses);
      debug.log('GameContext', 'Resources stolen:', resourcesStolen);

      // Update attacker's army and resources
      const updatedAttackerArmy = {
        swordsmen: Math.max(0, (gameState.army.swordsmen || 0) - (attackerLosses.swordsmen || 0)),
        archers: Math.max(0, (gameState.army.archers || 0) - (attackerLosses.archers || 0)),
        cavalry: Math.max(0, (gameState.army.cavalry || 0) - (attackerLosses.cavalry || 0)),
        catapults: Math.max(0, (gameState.army.catapults || 0) - (attackerLosses.catapults || 0))
      };
      
      const updatedAttackerResources = {
        gold: (gameState.resources?.gold || 0) + (resourcesStolen.gold || 0),
        food: (gameState.resources?.food || 0) + (resourcesStolen.food || 0),
        wood: (gameState.resources?.wood || 0) + (resourcesStolen.wood || 0),
        stone: (gameState.resources?.stone || 0) + (resourcesStolen.stone || 0)
      };
      
      // Update defender's army and resources
      const updatedDefenderArmy = {
        swordsmen: Math.max(0, (targetKingdom.army.swordsmen || 0) - (defenderLosses.swordsmen || 0)),
        archers: Math.max(0, (targetKingdom.army.archers || 0) - (defenderLosses.archers || 0)),
        cavalry: Math.max(0, (targetKingdom.army.cavalry || 0) - (defenderLosses.cavalry || 0)),
        catapults: Math.max(0, (targetKingdom.army.catapults || 0) - (defenderLosses.catapults || 0))
      };
      
      const updatedDefenderResources = targetKingdom.resources ? {
        gold: Math.max(0, (targetKingdom.resources.gold || 0) - (resourcesStolen.gold || 0)),
        food: Math.max(0, (targetKingdom.resources.food || 0) - (resourcesStolen.food || 0)),
        wood: Math.max(0, (targetKingdom.resources.wood || 0) - (resourcesStolen.wood || 0)),
        stone: Math.max(0, (targetKingdom.resources.stone || 0) - (resourcesStolen.stone || 0))
      } : { gold: 0, food: 0, wood: 0, stone: 0 };

      // Create war report
      const warReport = {
        attacker_id: gameState.id,
        defender_id: targetKingdom.id,
        victory: victory,
        report: {
          attacker_name: gameState.kingdom_name,
          defender_name: targetKingdom.kingdom_name,
          attack_power: attackPower,
          defense_power: defensePower,
          attacker_losses: attackerLosses,
          defender_losses: defenderLosses,
          resources_stolen: resourcesStolen,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('*** KINGDOM DEBUG: War report to insert ***', JSON.stringify(warReport, null, 2));
      debug.log('GameContext', 'War report to insert:', warReport);

      // Check if war_reports table exists using safeSupabaseOperation
      const { data: tableInfo, error: tableError } = await safeSupabaseOperation(
        () => supabase
          .from('war_reports')
          .select('*')
          .limit(1),
        { data: null, error: new Error('War reports table check failed') }
      );
      
      console.log('*** KINGDOM DEBUG: War reports table check ***', { data: tableInfo, error: tableError });
      
      if (tableError) {
        console.error('*** KINGDOM DEBUG: War reports table might not exist ***', tableError);
        console.warn('*** KINGDOM DEBUG: Continuing without war report ***');
        // Continue without war report - don't throw error
      } else {
        // Table exists, try to insert the war report using safeSupabaseOperation
        console.log('*** KINGDOM DEBUG: Attempting to insert war report ***');
        
        const { data: reportData, error: reportError } = await safeSupabaseOperation(
          () => supabase
            .from('war_reports')
            .insert(warReport)
            .select(),
          { data: null, error: new Error('War report insert failed') }
        );
        
        console.log('*** KINGDOM DEBUG: Report insert result ***', { data: reportData, error: reportError });
        debug.log('GameContext', 'Report insert result:', { data: reportData, error: reportError });

        if (reportError) {
          console.error('*** KINGDOM DEBUG: Error inserting war report ***', reportError);
          
          // Check if it's a permissions issue
          if (reportError.code === '42501' || reportError.message.includes('permission denied')) {
            console.error('*** KINGDOM DEBUG: Permission denied - check RLS policies ***');
          }
          
          // Check if it's a foreign key constraint issue
          if (reportError.code === '23503' || reportError.message.includes('foreign key constraint')) {
            console.error('*** KINGDOM DEBUG: Foreign key constraint violation ***');
          }
          
          // Check if it's a not-null constraint issue
          if (reportError.code === '23502' || reportError.message.includes('not-null constraint')) {
            console.error('*** KINGDOM DEBUG: Not-null constraint violation ***');
            console.error('*** KINGDOM DEBUG: Required fields check ***', {
              attacker_id: !!warReport.attacker_id,
              defender_id: !!warReport.defender_id,
              victory: typeof warReport.victory === 'boolean',
              report: !!warReport.report
            });
          }
          
          console.warn('*** KINGDOM DEBUG: Continuing without war report ***');
          // Continue without war report - don't throw error
        } else {
          console.log('*** KINGDOM DEBUG: War report created successfully ***', reportData);
        }
      }

      // Update attacker state using safeSupabaseOperation
      const { error: attackerUpdateError } = await safeSupabaseOperation(
        () => supabase
          .from('game_states')
          .update({
            army: updatedAttackerArmy,
            resources: updatedAttackerResources
          })
          .eq('id', gameState.id),
        { error: new Error('Failed to update attacker state') }
      );
        
      console.log('*** KINGDOM DEBUG: Attacker update error ***', attackerUpdateError);
      debug.log('GameContext', 'Attacker update error:', attackerUpdateError);

      if (attackerUpdateError) {
        console.error('*** KINGDOM DEBUG: Error updating attacker state ***', attackerUpdateError);
        throw attackerUpdateError;
      }

      // Update defender state using safeSupabaseOperation - only if we have a real target kingdom
      if (!targetError) {
        const { error: defenderUpdateError } = await safeSupabaseOperation(
          () => supabase
            .from('game_states')
            .update({
              army: updatedDefenderArmy,
              resources: updatedDefenderResources
            })
            .eq('id', targetKingdom.id),
          { error: null }
        );
          
        console.log('*** KINGDOM DEBUG: Defender update error ***', defenderUpdateError);
        debug.log('GameContext', 'Defender update error:', defenderUpdateError);

        if (defenderUpdateError) {
          console.error('*** KINGDOM DEBUG: Error updating defender state ***', defenderUpdateError);
          // Don't throw here, just log the error and continue
        }
      } else {
        console.warn('*** KINGDOM DEBUG: Skipping defender update due to original fetch error ***');
      }

      // Update local state
      setGameState({
        ...gameState,
        army: updatedAttackerArmy,
        resources: updatedAttackerResources
      });
      
      // Return battle result for UI
      return {
        victory,
        attackPower,
        defensePower,
        attackerLosses,
        defenderLosses,
        resourcesStolen
      };
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error attacking kingdom ***', error);
      console.error('Error attacking kingdom:', error);
      setError('Failed to attack kingdom');
      return null;
    }
  }

  // Helper function to calculate army losses
  function calculateLosses(army, lossPercentage) {
    if (!army) return {};
    
    return {
      swordsmen: Math.floor((army.swordsmen || 0) * lossPercentage),
      archers: Math.floor((army.archers || 0) * lossPercentage),
      cavalry: Math.floor((army.cavalry || 0) * lossPercentage),
      catapults: Math.floor((army.catapults || 0) * lossPercentage)
    };
  }

  // Calculate total army power
  function calculateArmyPower(army) {
    // Check if army is undefined or null
    if (!army) {
      console.warn('*** KINGDOM DEBUG: Army is undefined or null in calculateArmyPower ***');
      return 0;
    }
    
    // Ensure all army units exist, defaulting to 0 if not
    const swordsmen = army.swordsmen || 0;
    const archers = army.archers || 0;
    const cavalry = army.cavalry || 0;
    const catapults = army.catapults || 0;
    
    return (swordsmen * 1) + 
           (archers * 1.5) + 
           (cavalry * 3) + 
           (catapults * 5);
  }

  // Calculate defense power
  function calculateDefensePower(army, castle) {
    // Check if army or castle is undefined or null
    if (!army) {
      console.warn('*** KINGDOM DEBUG: Army is undefined or null in calculateDefensePower ***');
      return 0;
    }
    
    if (!castle) {
      console.warn('*** KINGDOM DEBUG: Castle is undefined or null in calculateDefensePower ***');
      return calculateArmyPower(army); // Just use army power without bonus
    }
    
    const armyPower = calculateArmyPower(army);
    const defenseBonus = (castle.defense_bonus || 0) / 100;
    return armyPower * (1 + defenseBonus);
  }

  // Collect resources
  async function collectResources() {
    if (!gameState) return;
    
    try {
      const currentTime = new Date().getTime();
      const lastCollectionTime = new Date(gameState.last_resource_collection).getTime();
      const timeDiffSeconds = (currentTime - lastCollectionTime) / 1000;
      
      // Calculate resources gained
      const goldPerSecond = gameState.buildings.mine.gold_production / 3600;
      const foodPerSecond = gameState.buildings.farm.food_production / 3600;
      
      const goldGained = Math.floor(timeDiffSeconds * goldPerSecond);
      const foodGained = Math.floor(timeDiffSeconds * foodPerSecond);
      
      // Update game state
      const updatedState = {
        ...gameState,
        resources: {
          ...gameState.resources,
          gold: gameState.resources.gold + goldGained,
          food: gameState.resources.food + foodGained
        },
        last_resource_collection: new Date().toISOString()
      };
      
      // Update in database
      await updateGameState(updatedState);
      
      return {
        goldGained,
        foodGained
      };
      
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error collecting resources ***', error);
      console.error('Error collecting resources:', error);
      setError('Failed to collect resources');
      return null;
    }
  }

  // Build/upgrade building
  async function upgradeBuilding(buildingType) {
    if (!gameState) return;
    
    try {
      const currentLevel = gameState.buildings[buildingType].level;
      const upgradeCost = calculateUpgradeCost(buildingType, currentLevel);
      
      // Check if player has enough resources
      if (gameState.resources.gold < upgradeCost) {
        console.error('*** KINGDOM DEBUG: Not enough gold for upgrade ***');
        throw new Error('Not enough gold for upgrade');
      }
      
      // Calculate new building stats
      const updatedBuilding = calculateBuildingStats(buildingType, currentLevel + 1);
      
      // Update game state
      const updatedState = {
        ...gameState,
        resources: {
          ...gameState.resources,
          gold: gameState.resources.gold - upgradeCost
        },
        buildings: {
          ...gameState.buildings,
          [buildingType]: updatedBuilding
        }
      };
      
      // Update in database
      await updateGameState(updatedState);
      
      return updatedBuilding;
      
    } catch (error) {
      console.error(`*** KINGDOM DEBUG: Error upgrading ${buildingType} ***`, error);
      console.error(`Error upgrading ${buildingType}:`, error);
      setError(`Failed to upgrade ${buildingType}`);
      return null;
    }
  }
  
  // Calculate upgrade cost
  function calculateUpgradeCost(buildingType, currentLevel) {
    const baseCosts = {
      castle: 1000,
      barracks: 500,
      farm: 300,
      mine: 400
    };
    
    return Math.floor(baseCosts[buildingType] * Math.pow(1.5, currentLevel));
  }
  
  // Calculate building stats after upgrade
  function calculateBuildingStats(buildingType, newLevel) {
    switch (buildingType) {
      case 'castle':
        return {
          level: newLevel,
          defense_bonus: 10 * newLevel
        };
      case 'barracks':
        return {
          level: newLevel,
          training_speed: newLevel
        };
      case 'farm':
        return {
          level: newLevel,
          food_production: 10 * newLevel
        };
      case 'mine':
        return {
          level: newLevel,
          gold_production: 5 * newLevel
        };
      default:
        return {
          level: newLevel
        };
    }
  }
  
  // Train troops
  async function trainTroops(troopType, count) {
    if (!gameState) return;
    
    try {
      const troopCosts = {
        swordsmen: { gold: 50, food: 20 },
        archers: { gold: 80, food: 15 },
        cavalry: { gold: 150, food: 30 },
        catapults: { gold: 300, food: 50 }
      };
      
      const totalGoldCost = troopCosts[troopType].gold * count;
      const totalFoodCost = troopCosts[troopType].food * count;
      
      // Check if player has enough resources
      if (gameState.resources.gold < totalGoldCost || 
          gameState.resources.food < totalFoodCost) {
        console.error('*** KINGDOM DEBUG: Not enough resources to train troops ***');
        throw new Error('Not enough resources to train troops');
      }
      
      // Update game state
      const updatedState = {
        ...gameState,
        resources: {
          ...gameState.resources,
          gold: gameState.resources.gold - totalGoldCost,
          food: gameState.resources.food - totalFoodCost
        },
        army: {
          ...gameState.army,
          [troopType]: gameState.army[troopType] + count
        }
      };
      
      // Update in database
      await updateGameState(updatedState);
      
      return updatedState.army;
      
    } catch (error) {
      console.error(`*** KINGDOM DEBUG: Error training ${troopType} ***`, error);
      console.error(`Error training ${troopType}:`, error);
      setError(`Failed to train ${troopType}`);
      return null;
    }
  }

  // Sign out
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Error signing out ***', error);
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  }

  async function safeSupabaseOperation(operation, fallbackValue = null, timeoutMs = 10000) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      
      // Execute the operation with timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error) {
      console.error('*** KINGDOM DEBUG: Safe operation error ***', error);
      debug.log('GameContext', 'Safe operation error:', error);
      
      // Return fallback value instead of throwing
      return fallbackValue;
    }
  }

  const value = {
    user,
    gameState,
    otherKingdoms,
    warReports,
    loading,
    error,
    setError,
    attackKingdom,
    collectResources,
    upgradeBuilding,
    trainTroops,
    signOut,
    handleEmergencyMode,
    calculateArmyPower,
    calculateDefensePower
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
