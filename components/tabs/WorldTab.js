import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import AttackModal from '../modals/AttackModal';

export default function WorldTab({ addNotification }) {
  const { gameState, otherKingdoms, calculateArmyPower, calculateDefensePower } = useGame();
  const [selectedKingdom, setSelectedKingdom] = useState(null);
  const [showAttackModal, setShowAttackModal] = useState(false);

  const handleAttackClick = (kingdom) => {
    setSelectedKingdom(kingdom);
    setShowAttackModal(true);
  };

  const closeAttackModal = () => {
    setShowAttackModal(false);
    setSelectedKingdom(null);
  };

  const handleAttackSuccess = (warReport) => {
    closeAttackModal();
    
    if (warReport.victory) {
      addNotification({
        message: `Victory! You stole ${warReport.gold_stolen} gold from ${warReport.defender_name}`,
        type: 'success'
      });
    } else {
      addNotification({
        message: `Defeat! Your attack on ${warReport.defender_name} failed`,
        type: 'error'
      });
    }
  };

  // Calculate attack ratio against a kingdom
  const calculateAttackRatio = (targetKingdom) => {
    const attackPower = calculateArmyPower(gameState.army);
    const defensePower = calculateDefensePower(
      targetKingdom.army,
      targetKingdom.buildings.castle
    );
    
    return attackPower / defensePower;
  };

  // Estimate success chance based on attack ratio
  const estimateSuccessChance = (ratio) => {
    if (ratio < 0.5) return 'Very Low';
    if (ratio < 0.8) return 'Low';
    if (ratio < 1.0) return 'Medium';
    if (ratio < 1.5) return 'High';
    return 'Very High';
  };

  // Get color for success chance
  const getSuccessChanceColor = (chance) => {
    switch (chance) {
      case 'Very Low': return 'var(--color-danger)';
      case 'Low': return '#e67e22';
      case 'Medium': return 'var(--color-accent)';
      case 'High': return '#2ecc71';
      case 'Very High': return 'var(--color-primary)';
      default: return 'var(--color-text)';
    }
  };

  return (
    <div>
      <h2>World Map</h2>
      
      <div className="card">
        <h3>Other Kingdoms</h3>
        
        {otherKingdoms.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem 0' }}>
            No other kingdoms found. Check back later!
          </p>
        ) : (
          <div className="game-table-container">
            <table className="game-table">
              <thead>
                <tr>
                  <th>Kingdom</th>
                  <th>Army Size</th>
                  <th>Success Chance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {otherKingdoms.map((kingdom) => {
                  const ratio = calculateAttackRatio(kingdom);
                  const successChance = estimateSuccessChance(ratio);
                  
                  return (
                    <tr key={kingdom.id}>
                      <td>{kingdom.kingdom_name}</td>
                      <td>
                        {Object.values(kingdom.army).reduce((sum, count) => sum + count, 0)}
                      </td>
                      <td style={{ color: getSuccessChanceColor(successChance) }}>
                        {successChance}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleAttackClick(kingdom)}
                          disabled={Object.values(gameState.army).reduce((sum, count) => sum + count, 0) === 0}
                        >
                          Attack
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Your Kingdom</h3>
        
        <div className="kingdom-stats">
          <div className="stat-item">
            <div className="stat-label">Kingdom Name</div>
            <div className="stat-value">{gameState.kingdom_name}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Army Size</div>
            <div className="stat-value">
              {Object.values(gameState.army).reduce((sum, count) => sum + count, 0)}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Attack Power</div>
            <div className="stat-value">⚔️ {calculateArmyPower(gameState.army)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Defense Rating</div>
            <div className="stat-value">
              🛡️ {calculateDefensePower(
                gameState.army,
                gameState.buildings.castle
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Attack Guide</h3>
        
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Attack other kingdoms to steal their gold</li>
          <li>Success chance is based on your army's attack power vs their defense</li>
          <li>If your attack power is greater than their defense, you will win</li>
          <li>The amount of gold stolen depends on the attack/defense ratio</li>
          <li>A ratio of 2.0 or higher will steal 100% of their gold</li>
          <li>Train more troops to increase your attack power</li>
          <li>Upgrade your castle to increase your defense bonus</li>
        </ul>
      </div>
      
      {showAttackModal && selectedKingdom && (
        <AttackModal
          targetKingdom={selectedKingdom}
          onClose={closeAttackModal}
          onAttackSuccess={handleAttackSuccess}
        />
      )}
    </div>
  );
}
