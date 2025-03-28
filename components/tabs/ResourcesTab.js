import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';

export default function ResourcesTab({ addNotification }) {
  const { gameState, collectResources } = useGame();
  const [collecting, setCollecting] = useState(false);

  const handleCollectResources = async () => {
    setCollecting(true);
    try {
      const result = await collectResources();
      
      if (result) {
        addNotification({
          message: `Collected ${result.goldGained} gold and ${result.foodGained} food`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error collecting resources:', error);
      addNotification({
        message: 'Failed to collect resources',
        type: 'error'
      });
    } finally {
      setCollecting(false);
    }
  };

  const calculateTimeUntilNextCollection = () => {
    const lastCollection = new Date(gameState.last_resource_collection);
    const now = new Date();
    const diffSeconds = Math.floor((now - lastCollection) / 1000);
    
    // Resources can be collected every 5 minutes (300 seconds)
    const remainingSeconds = Math.max(0, 300 - diffSeconds);
    
    if (remainingSeconds <= 0) {
      return 'Ready to collect';
    }
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    return `${minutes}m ${seconds}s`;
  };

  const calculateResourceProduction = () => {
    return {
      goldPerHour: gameState.buildings.mine.gold_production,
      foodPerHour: gameState.buildings.farm.food_production
    };
  };

  const production = calculateResourceProduction();
  const collectionTime = calculateTimeUntilNextCollection();
  const canCollect = collectionTime === 'Ready to collect';

  return (
    <div>
      <h2>Resources</h2>
      
      <div className="card">
        <h3>Resource Production</h3>
        
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
            <div className="stat-label">Gold Production</div>
            <div className="stat-value">⛏️ {production.goldPerHour}/hour</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Food Production</div>
            <div className="stat-value">🌾 {production.foodPerHour}/hour</div>
          </div>
        </div>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>
            Next collection: <span style={{ color: canCollect ? 'var(--color-primary)' : 'var(--color-text)' }}>
              {collectionTime}
            </span>
          </p>
          
          <button 
            className="btn btn-accent"
            onClick={handleCollectResources}
            disabled={collecting || !canCollect}
          >
            {collecting ? 'Collecting...' : 'Collect Resources'}
          </button>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Resource Buildings</h3>
        
        <div className="game-table-container">
          <table className="game-table">
            <thead>
              <tr>
                <th>Building</th>
                <th>Level</th>
                <th>Production</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span style={{ marginRight: '0.5rem' }}>⛏️</span>
                  Mine
                </td>
                <td>{gameState.buildings.mine.level}</td>
                <td>{gameState.buildings.mine.gold_production} gold/hour</td>
              </tr>
              <tr>
                <td>
                  <span style={{ marginRight: '0.5rem' }}>🌾</span>
                  Farm
                </td>
                <td>{gameState.buildings.farm.level}</td>
                <td>{gameState.buildings.farm.food_production} food/hour</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
          Upgrade your Mine and Farm in the Kingdom tab to increase resource production.
        </p>
      </div>
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Resource Tips</h3>
        
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Gold is used for building upgrades and training troops</li>
          <li>Food is required to maintain your army</li>
          <li>Upgrade your Mine to increase gold production</li>
          <li>Upgrade your Farm to increase food production</li>
          <li>Resources can be collected every 5 minutes</li>
          <li>Attack other kingdoms to steal their gold</li>
        </ul>
      </div>
    </div>
  );
}
