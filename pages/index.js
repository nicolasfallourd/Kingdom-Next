import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Components
import KingdomTab from '../components/tabs/KingdomTab';
import ResourcesTab from '../components/tabs/ResourcesTab';
import ArmyTab from '../components/tabs/ArmyTab';
import WorldTab from '../components/tabs/WorldTab';
import WarTab from '../components/tabs/WarTab';
import LoadingScreen from '../components/LoadingScreen';
import Notification from '../components/Notification';

export default function Home() {
  const { 
    user, 
    gameState, 
    loading, 
    error, 
    setError,
    signOut,
    collectResources
  } = useGame();
  
  const [activeTab, setActiveTab] = useState('kingdom');
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Set up resource collection interval
  useEffect(() => {
    if (gameState) {
      // Collect resources immediately when game loads
      handleCollectResources();
      
      // Set up interval to collect resources every minute
      const interval = setInterval(handleCollectResources, 60000);
      
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Handle resource collection
  const handleCollectResources = async () => {
    try {
      const result = await collectResources();
      if (result && (result.goldGained > 0 || result.foodGained > 0)) {
        addNotification({
          message: `Collected ${result.goldGained} gold and ${result.foodGained} food`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error collecting resources:', error);
    }
  };

  // Add notification
  const addNotification = (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, ...notification }]);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  };

  // Show loading screen while data is being fetched
  if (loading) {
    return <LoadingScreen />;
  }

  // Render main game interface
  return (
    <>
      <Head>
        <title>Kingdom Management Game</title>
        <meta name="description" content="Medieval-themed Kingdom Management Game" />
      </Head>

      <div className="container">
        {/* Game Header */}
        <div className="game-header">
          <h1>Kingdom Management Game</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {gameState && (
              <div className="resource-display">
                <span className="resource-icon">💰</span>
                <span>{gameState.resources.gold}</span>
                <span className="resource-icon">🍖</span>
                <span>{gameState.resources.food}</span>
              </div>
            )}
            <button onClick={handleSignOut} className="btn btn-danger">Logout</button>
          </div>
        </div>

        {/* Game Content */}
        <div className="card">
          {/* Tab Navigation */}
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'kingdom' ? 'active' : ''}`}
              onClick={() => handleTabChange('kingdom')}
            >
              Kingdom
            </div>
            <div 
              className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => handleTabChange('resources')}
            >
              Resources
            </div>
            <div 
              className={`tab ${activeTab === 'army' ? 'active' : ''}`}
              onClick={() => handleTabChange('army')}
            >
              Army
            </div>
            <div 
              className={`tab ${activeTab === 'world' ? 'active' : ''}`}
              onClick={() => handleTabChange('world')}
            >
              World
            </div>
            <div 
              className={`tab ${activeTab === 'war' ? 'active' : ''}`}
              onClick={() => handleTabChange('war')}
            >
              War
            </div>
          </div>

          {/* Tab Content */}
          {gameState && (
            <div className="tab-content">
              {activeTab === 'kingdom' && <KingdomTab addNotification={addNotification} />}
              {activeTab === 'resources' && <ResourcesTab addNotification={addNotification} />}
              {activeTab === 'army' && <ArmyTab addNotification={addNotification} />}
              {activeTab === 'world' && <WorldTab addNotification={addNotification} />}
              {activeTab === 'war' && <WarTab addNotification={addNotification} />}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="notification-area">
        {notifications.map(notification => (
          <Notification 
            key={notification.id}
            message={notification.message}
            type={notification.type}
          />
        ))}
      </div>
    </>
  );
}
