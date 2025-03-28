import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';

export default function ArmyTab({ addNotification }) {
  const { gameState, trainTroops, calculateArmyPower } = useGame();
  const [selectedTroop, setSelectedTroop] = useState('swordsmen');
  const [trainingCount, setTrainingCount] = useState(1);
  const [isTraining, setIsTraining] = useState(false);

  const troopTypes = {
    swordsmen: {
      name: 'Swordsmen',
      icon: '⚔️',
      power: 1,
      goldCost: 50,
      foodCost: 20,
      description: 'Basic infantry units with balanced attack and defense.'
    },
    archers: {
      name: 'Archers',
      icon: '🏹',
      power: 1.5,
      goldCost: 80,
      foodCost: 15,
      description: 'Ranged units that deal high damage but have low defense.'
    },
    cavalry: {
      name: 'Cavalry',
      icon: '🐎',
      power: 3,
      goldCost: 150,
      foodCost: 30,
      description: 'Fast and powerful units that excel in offensive attacks.'
    },
    catapults: {
      name: 'Catapults',
      icon: '🧱',
      power: 5,
      goldCost: 300,
      foodCost: 50,
      description: 'Siege weapons that deal massive damage to enemy defenses.'
    }
  };

  const handleTrainTroops = async () => {
    if (trainingCount <= 0) {
      addNotification({
        message: 'Please select a valid number of troops to train',
        type: 'error'
      });
      return;
    }

    const totalGoldCost = troopTypes[selectedTroop].goldCost * trainingCount;
    const totalFoodCost = troopTypes[selectedTroop].foodCost * trainingCount;

    if (gameState.resources.gold < totalGoldCost || gameState.resources.food < totalFoodCost) {
      addNotification({
        message: 'Not enough resources to train troops',
        type: 'error'
      });
      return;
    }

    setIsTraining(true);
    try {
      const result = await trainTroops(selectedTroop, trainingCount);
      
      if (result) {
        addNotification({
          message: `Trained ${trainingCount} ${troopTypes[selectedTroop].name}`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error training troops:', error);
      addNotification({
        message: 'Failed to train troops',
        type: 'error'
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleCountChange = (e) => {
    const value = parseInt(e.target.value);
    setTrainingCount(isNaN(value) ? 0 : Math.max(0, value));
  };

  const totalArmyPower = calculateArmyPower(gameState.army);
  const defenseBonus = gameState.buildings.castle.defense_bonus;
  const totalDefensePower = Math.floor(totalArmyPower * (1 + defenseBonus / 100));

  return (
    <div>
      <h2>Army</h2>
      
      <div className="card">
        <h3>Army Overview</h3>
        
        <div className="kingdom-stats">
          <div className="stat-item">
            <div className="stat-label">Total Units</div>
            <div className="stat-value">
              {Object.values(gameState.army).reduce((sum, count) => sum + count, 0)}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Attack Power</div>
            <div className="stat-value">⚔️ {totalArmyPower}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Defense Bonus</div>
            <div className="stat-value">🏰 +{defenseBonus}%</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Total Defense</div>
            <div className="stat-value">🛡️ {totalDefensePower}</div>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Current Army</h3>
        
        <div className="game-table-container">
          <table className="game-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Count</th>
                <th>Power</th>
                <th>Total Power</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(gameState.army).map(([troopType, count]) => (
                <tr key={troopType}>
                  <td>
                    <span style={{ marginRight: '0.5rem' }}>{troopTypes[troopType].icon}</span>
                    {troopTypes[troopType].name}
                  </td>
                  <td>{count}</td>
                  <td>{troopTypes[troopType].power}</td>
                  <td>{count * troopTypes[troopType].power}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Train Troops</h3>
        
        <div className="tabs" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
          {Object.entries(troopTypes).map(([troopType, troop]) => (
            <div 
              key={troopType}
              className={`tab ${selectedTroop === troopType ? 'active' : ''}`}
              onClick={() => setSelectedTroop(troopType)}
            >
              <span style={{ marginRight: '0.5rem' }}>{troop.icon}</span>
              {troop.name}
            </div>
          ))}
        </div>
        
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2rem', marginRight: '1rem' }}>
              {troopTypes[selectedTroop].icon}
            </div>
            <div>
              <h4>{troopTypes[selectedTroop].name}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                {troopTypes[selectedTroop].description}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ color: 'var(--color-text)' }}>Power:</span>
              <span style={{ marginLeft: '0.5rem', color: 'var(--color-accent)' }}>
                {troopTypes[selectedTroop].power}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text)' }}>Gold Cost:</span>
              <span style={{ marginLeft: '0.5rem', color: 'var(--color-accent)' }}>
                💰 {troopTypes[selectedTroop].goldCost}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text)' }}>Food Cost:</span>
              <span style={{ marginLeft: '0.5rem', color: 'var(--color-accent)' }}>
                🍖 {troopTypes[selectedTroop].foodCost}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label htmlFor="trainingCount">Number to Train:</label>
              <input
                type="number"
                id="trainingCount"
                className="form-control"
                value={trainingCount}
                onChange={handleCountChange}
                min="1"
                max="1000"
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <p style={{ marginBottom: '0.25rem' }}>Total Cost:</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ color: 'var(--color-accent)' }}>
                  💰 {troopTypes[selectedTroop].goldCost * trainingCount}
                </span>
                <span style={{ color: 'var(--color-accent)' }}>
                  🍖 {troopTypes[selectedTroop].foodCost * trainingCount}
                </span>
              </div>
            </div>
          </div>
          
          <button
            className="btn btn-primary"
            onClick={handleTrainTroops}
            disabled={isTraining || trainingCount <= 0}
            style={{ width: '100%' }}
          >
            {isTraining ? 'Training...' : `Train ${trainingCount} ${troopTypes[selectedTroop].name}`}
          </button>
        </div>
      </div>
    </div>
  );
}
