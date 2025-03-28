import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

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

  // Check for user session on mount
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          await fetchGameState(session.user.id);
        } else {
          setUser(null);
          setGameState(null);
          if (router.pathname !== '/login' && router.pathname !== '/register') {
            router.push('/login');
          }
        }
        setLoading(false);
      }
    );

    // Initial session check
    checkUser();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchGameState(session.user.id);
      } else {
        setUser(null);
        setGameState(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  }

  async function fetchGameState(userId) {
    try {
      // Fetch game state
      const { data: gameStateData, error: gameStateError } = await supabase
        .from('game_states')
        .select('*')
        .eq('id', userId)
        .single();

      if (gameStateError && gameStateError.code !== 'PGRST116') {
        throw gameStateError;
      }

      // If no game state exists, create a new one
      if (!gameStateData) {
        await createNewGameState(userId);
      } else {
        setGameState(gameStateData);
      }

      // Fetch other kingdoms
      const { data: kingdoms, error: kingdomsError } = await supabase
        .from('game_states')
        .select('id, kingdom_name, buildings, army')
        .neq('id', userId)
        .limit(10);

      if (kingdomsError) {
        throw kingdomsError;
      }
      
      setOtherKingdoms(kingdoms || []);

      // Fetch war reports
      const { data: reports, error: reportsError } = await supabase
        .from('war_reports')
        .select('*')
        .or(`attacker_id.eq.${userId},defender_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reportsError) {
        throw reportsError;
      }
      
      setWarReports(reports || []);

    } catch (error) {
      console.error('Error fetching game data:', error);
      setError('Failed to load game data');
    }
  }

  async function createNewGameState(userId) {
    try {
      // Get user metadata for username
      const { data: { user } } = await supabase.auth.getUser();
      const username = user?.user_metadata?.username || 'Kingdom';

      const newGameState = {
        id: userId,
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

      const { data, error } = await supabase
        .from('game_states')
        .insert(newGameState)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setGameState(data);
    } catch (error) {
      console.error('Error creating new game state:', error);
      setError('Failed to create new game state');
    }
  }

  async function updateGameState(newState) {
    try {
      const { error } = await supabase
        .from('game_states')
        .update(newState)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setGameState(newState);
    } catch (error) {
      console.error('Error updating game state:', error);
      setError('Failed to update game state');
    }
  }

  // Calculate total army power
  function calculateArmyPower(army) {
    return (army.swordsmen * 1) + 
           (army.archers * 1.5) + 
           (army.cavalry * 3) + 
           (army.catapults * 5);
  }

  // Calculate defense power
  function calculateDefensePower(army, castle) {
    const armyPower = calculateArmyPower(army);
    const defenseBonus = castle.defense_bonus / 100;
    return armyPower * (1 + defenseBonus);
  }

  // Attack another kingdom
  async function attackKingdom(targetKingdomId) {
    try {
      // Get target kingdom data
      const { data: targetKingdom, error: targetError } = await supabase
        .from('game_states')
        .select('*')
        .eq('id', targetKingdomId)
        .single();

      if (targetError) {
        throw targetError;
      }

      // Calculate attack power
      const attackPower = calculateArmyPower(gameState.army);
      
      // Calculate defense power
      const defensePower = calculateDefensePower(
        targetKingdom.army, 
        targetKingdom.buildings.castle
      );
      
      // Calculate attack/defense ratio
      const ratio = attackPower / defensePower;
      
      // Calculate gold stolen based on ratio
      let goldStolen = 0;
      if (ratio >= 1) {
        // Linear scaling between 1 and 2
        const stealPercentage = ratio >= 2 ? 1 : (ratio - 1);
        goldStolen = Math.floor(targetKingdom.resources.gold * stealPercentage);
      }
      
      // Create war report
      const warReport = {
        attacker_id: user.id,
        defender_id: targetKingdomId,
        attacker_name: gameState.kingdom_name,
        defender_name: targetKingdom.kingdom_name,
        attacker_army: gameState.army,
        defender_army: targetKingdom.army,
        attack_power: attackPower,
        defense_power: defensePower,
        gold_stolen: goldStolen,
        victory: ratio >= 1,
        created_at: new Date().toISOString()
      };
      
      // Insert war report
      const { error: reportError } = await supabase
        .from('war_reports')
        .insert(warReport);
        
      if (reportError) {
        throw reportError;
      }
      
      // Update attacker's gold
      const updatedAttackerState = {
        ...gameState,
        resources: {
          ...gameState.resources,
          gold: gameState.resources.gold + goldStolen
        }
      };
      
      // Update defender's gold
      const updatedDefenderState = {
        ...targetKingdom,
        resources: {
          ...targetKingdom.resources,
          gold: targetKingdom.resources.gold - goldStolen
        }
      };
      
      // Update both kingdoms in database
      const { error: updateError } = await supabase
        .from('game_states')
        .upsert([
          updatedAttackerState,
          updatedDefenderState
        ]);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setGameState(updatedAttackerState);
      
      // Fetch updated war reports
      await fetchGameState(user.id);
      
      return warReport;
      
    } catch (error) {
      console.error('Error attacking kingdom:', error);
      setError('Failed to attack kingdom');
      return null;
    }
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
      console.error('Error signing out:', error);
      setError('Failed to sign out');
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
    calculateArmyPower,
    calculateDefensePower
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
