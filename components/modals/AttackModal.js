import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';

export default function AttackModal({ targetKingdom, onClose, onAttackSuccess }) {
  const { gameState, attackKingdom, calculateArmyPower, calculateDefensePower } = useGame();
  const [countdown, setCountdown] = useState(5);
  const [attacking, setAttacking] = useState(false);
  const [attackResult, setAttackResult] = useState(null);
  const [countdownActive, setCountdownActive] = useState(false);

  // Calculate attack ratio
  const attackPower = calculateArmyPower(gameState.army);
  const defensePower = calculateDefensePower(
    targetKingdom.army,
    targetKingdom.buildings.castle
  );
  const ratio = attackPower / defensePower;

  // Estimate gold that can be stolen
  const estimateGoldStolen = () => {
    if (ratio < 1) return 0;
    
    // Linear scaling between 1 and 2
    const stealPercentage = ratio >= 2 ? 1 : (ratio - 1);
    // We don't know the exact gold amount, so we provide an estimate
    return Math.floor(1000 * stealPercentage); // Assuming 1000 gold as a baseline
  };

  // Start countdown
  const handleStartAttack = () => {
    setCountdownActive(true);
  };

  // Handle the actual attack
  const handleAttack = async () => {
    setAttacking(true);
    try {
      const result = await attackKingdom(targetKingdom.id);
      setAttackResult(result);
      
      if (result) {
        onAttackSuccess(result);
      }
    } catch (error) {
      console.error('Error attacking kingdom:', error);
    } finally {
      setAttacking(false);
    }
  };

  // Countdown effect
  useEffect(() => {
    if (!countdownActive) return;
    
    if (countdown <= 0) {
      handleAttack();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, countdownActive]);

  return (
    <div className="modal-overlay">
      <div className="modal attack-modal">
        <div className="modal-header">
          <h3 className="modal-title">Attack {targetKingdom.kingdom_name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-content">
          {!countdownActive && !attackResult && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Battle Analysis</h4>
                
                <div className="kingdom-stats" style={{ marginBottom: '1rem' }}>
                  <div className="stat-item">
                    <div className="stat-label">Your Attack</div>
                    <div className="stat-value">⚔️ {attackPower}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Enemy Defense</div>
                    <div className="stat-value">🛡️ {defensePower}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Power Ratio</div>
                    <div className="stat-value" style={{ 
                      color: ratio >= 1 ? 'var(--color-primary)' : 'var(--color-danger)' 
                    }}>
                      {ratio.toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Est. Gold Loot</div>
                    <div className="stat-value" style={{ color: 'var(--color-accent)' }}>
                      💰 {estimateGoldStolen()}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: ratio >= 1 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ textAlign: 'center' }}>
                    {ratio >= 1 ? 
                      `Victory is likely! You should be able to steal some gold.` :
                      `Defeat is likely. Your forces are not strong enough.`}
                  </p>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1rem' }}>
                  Once you start the attack, there will be a 5-second countdown before the attack is launched.
                  This gives you time to reconsider your decision.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleStartAttack}
                  style={{ flex: 1 }}
                  disabled={attacking}
                >
                  Attack!
                </button>
              </div>
            </>
          )}
          
          {countdownActive && countdown > 0 && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem' }}>Preparing Attack...</h3>
              <div className="countdown">{countdown}</div>
              <p>Your troops are getting into position...</p>
              <button 
                className="btn btn-secondary"
                onClick={onClose}
                style={{ marginTop: '1rem' }}
              >
                Cancel Attack
              </button>
            </div>
          )}
          
          {countdown <= 0 && attacking && (
            <div style={{ textAlign: 'center' }}>
              <h3>Attacking...</h3>
              <div className="spinner" style={{ margin: '2rem auto' }}></div>
              <p>Your troops are engaging the enemy!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
