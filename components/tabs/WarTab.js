import React from 'react';
import { useGame } from '../../contexts/GameContext';

export default function WarTab({ addNotification }) {
  const { warReports, gameState } = useGame();

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <h2>War Reports</h2>
      
      {warReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p>No war reports yet. Attack other kingdoms to create war reports!</p>
        </div>
      ) : (
        <div>
          {warReports.map((report) => {
            const isAttacker = report.attacker_id === gameState.id;
            const isVictory = isAttacker ? report.victory : !report.victory;
            
            return (
              <div 
                key={report.id} 
                className={`card war-report ${isVictory ? 'victory' : 'defeat'}`}
                style={{ marginBottom: '1rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4>
                    {isAttacker ? 
                      `Attack on ${report.defender_name}` : 
                      `Defended against ${report.attacker_name}`}
                  </h4>
                  <span style={{ 
                    color: isVictory ? 'var(--color-primary)' : 'var(--color-danger)',
                    fontWeight: 'bold'
                  }}>
                    {isVictory ? 'Victory' : 'Defeat'}
                  </span>
                </div>
                
                <p style={{ color: 'var(--color-text)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  {formatDate(report.created_at)}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                      {isAttacker ? 'Your Forces:' : 'Enemy Forces:'}
                    </p>
                    <p>
                      Attack Power: <span style={{ color: 'var(--color-accent)' }}>
                        {report.attack_power}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                      {isAttacker ? 'Enemy Forces:' : 'Your Forces:'}
                    </p>
                    <p>
                      Defense Power: <span style={{ color: 'var(--color-accent)' }}>
                        {report.defense_power}
                      </span>
                    </p>
                  </div>
                </div>
                
                {report.gold_stolen > 0 && (
                  <div className="loot-display">
                    <span>{isAttacker ? 'Gold stolen:' : 'Gold lost:'}</span>
                    <span style={{ color: 'var(--color-accent)' }}>
                      💰 {report.gold_stolen}
                    </span>
                  </div>
                )}
                
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.5rem',
                  backgroundColor: isVictory ? 
                    'rgba(76, 175, 80, 0.1)' : 
                    'rgba(231, 76, 60, 0.1)',
                  borderRadius: '4px'
                }}>
                  <p style={{ textAlign: 'center' }}>
                    {isAttacker ? (
                      report.victory ? 
                        `Your attack was successful! You stole ${report.gold_stolen} gold.` :
                        `Your attack failed. The enemy's defenses were too strong.`
                    ) : (
                      report.victory ? 
                        `Your defenses failed. The enemy stole ${report.gold_stolen} gold.` :
                        `Your defenses held! You successfully repelled the attack.`
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Battle Mechanics</h3>
        
        <p style={{ marginBottom: '1rem' }}>
          The outcome of battles is determined by comparing the attacker's attack power against the defender's defense power.
        </p>
        
        <div className="game-table-container">
          <table className="game-table">
            <thead>
              <tr>
                <th>Attack/Defense Ratio</th>
                <th>Outcome</th>
                <th>Gold Stolen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Less than 1.0</td>
                <td style={{ color: 'var(--color-danger)' }}>Defeat</td>
                <td>0%</td>
              </tr>
              <tr>
                <td>1.0 - 1.5</td>
                <td style={{ color: 'var(--color-primary)' }}>Victory</td>
                <td>0% - 50%</td>
              </tr>
              <tr>
                <td>1.5 - 2.0</td>
                <td style={{ color: 'var(--color-primary)' }}>Victory</td>
                <td>50% - 100%</td>
              </tr>
              <tr>
                <td>2.0 or higher</td>
                <td style={{ color: 'var(--color-primary)' }}>Victory</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
