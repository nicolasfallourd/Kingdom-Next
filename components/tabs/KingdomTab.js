import React from 'react';
import { useGame } from '../../contexts/GameContext';

export default function KingdomTab({ addNotification }) {
  const { gameState, upgradeBuilding } = useGame();

  const handleUpgradeBuilding = async (buildingType) => {
    try {
      const upgradeCost = calculateUpgradeCost(buildingType, gameState.buildings[buildingType].level);
      
      if (gameState.resources.gold < upgradeCost) {
        addNotification({
          message: `Not enough gold to upgrade ${formatBuildingName(buildingType)}`,
          type: 'error'
        });
        return;
      }
      
      const result = await upgradeBuilding(buildingType);
      
      if (result) {
        addNotification({
          message: `${formatBuildingName(buildingType)} upgraded to level ${result.level}`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error(`Error upgrading ${buildingType}:`, error);
      addNotification({
        message: `Failed to upgrade ${formatBuildingName(buildingType)}`,
        type: 'error'
      });
    }
  };

  const calculateUpgradeCost = (buildingType, currentLevel) => {
    const baseCosts = {
      castle: 1000,
      barracks: 500,
      farm: 300,
      mine: 400
    };
    
    return Math.floor(baseCosts[buildingType] * Math.pow(1.5, currentLevel));
  };

  const formatBuildingName = (buildingType) => {
    return buildingType.charAt(0).toUpperCase() + buildingType.slice(1);
  };

  const getBuildingDescription = (buildingType, building) => {
    switch (buildingType) {
      case 'castle':
        return `Defense Bonus: +${building.defense_bonus}%`;
      case 'barracks':
        return `Training Speed: x${building.training_speed}`;
      case 'farm':
        return `Food Production: ${building.food_production}/hour`;
      case 'mine':
        return `Gold Production: ${building.gold_production}/hour`;
      default:
        return '';
    }
  };

  const getBuildingIcon = (buildingType) => {
    switch (buildingType) {
      case 'castle': return '🏰';
      case 'barracks': return '⚔️';
      case 'farm': return '🌾';
      case 'mine': return '⛏️';
      default: return '🏢';
    }
  };

  return (
    <div>
      <h2>Your Kingdom: {gameState.kingdom_name}</h2>
      
      <div className="card">
        <h3>Buildings</h3>
        <div className="grid">
          {Object.entries(gameState.buildings).map(([buildingType, building]) => (
            <div key={buildingType} className="card" style={{ margin: '0.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4>
                  <span style={{ marginRight: '0.5rem' }}>{getBuildingIcon(buildingType)}</span>
                  {formatBuildingName(buildingType)}
                </h4>
                <span style={{ color: 'var(--color-accent)' }}>Level {building.level}</span>
              </div>
              
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                {getBuildingDescription(buildingType, building)}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-accent)' }}>
                  Upgrade: 💰 {calculateUpgradeCost(buildingType, building.level)}
                </span>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleUpgradeBuilding(buildingType)}
                  disabled={gameState.resources.gold < calculateUpgradeCost(buildingType, building.level)}
                >
                  Upgrade
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Kingdom Stats</h3>
        <div className="kingdom-stats">
          <div className="stat-item">
            <div className="stat-label">Gold</div>
            <div className="stat-value">💰 {gameState.resources.gold}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Food</div>
            <div className="stat-value">🍖 {gameState.resources.food}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Army Size</div>
            <div className="stat-value">
              ⚔️ {Object.values(gameState.army).reduce((sum, count) => sum + count, 0)}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Defense Rating</div>
            <div className="stat-value">
              🛡️ {Math.floor(
                Object.values(gameState.army).reduce((sum, count) => sum + count, 0) * 
                (1 + gameState.buildings.castle.defense_bonus / 100)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
