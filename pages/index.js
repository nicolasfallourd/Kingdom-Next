import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { debug } from '../lib/debug';

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
  const [loadingDetails, setLoadingDetails] = useState('Initializing...');
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

  useEffect(() => {
    debug.log('HomePage', 'Home page mounted', { user, gameState, loading, error });
    
    // Add more detailed loading information
    if (loading) {
      const checkLoadingState = () => {
        if (!user) {
          setLoadingDetails('Checking authentication...');
        } else if (!gameState) {
          setLoadingDetails('Fetching game state...');
        } else {
          setLoadingDetails('Preparing your kingdom...');
        }
      };
      
      checkLoadingState();
      const interval = setInterval(checkLoadingState, 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, gameState, loading, error]);

  // Show loading screen while data is being fetched
  if (loading) {
    debug.log('HomePage', 'Showing loading screen', { loadingDetails });
    return <LoadingScreen message={loadingDetails} />;
  }

  // Show error message if there was an error
  if (error) {
    debug.error('HomePage', 'Error in home page', error);
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '100px auto', 
        padding: '20px', 
        border: '1px solid black',
        fontFamily: 'monospace'
      }}>
        <h1>Error</h1>
        <p>{error}</p>
        <p>Please try refreshing the page or contact support if the problem persists.</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '8px 16px', 
            border: '1px solid black',
            background: 'white',
            cursor: 'pointer',
            fontFamily: 'monospace',
            marginTop: '20px'
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  // Ensure gameState exists
  if (!gameState) {
    debug.error('HomePage', 'Game state is null despite loading being complete');
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '100px auto', 
        padding: '20px', 
        border: '1px solid black',
        fontFamily: 'monospace'
      }}>
        <h1>Game State Error</h1>
        <p>Unable to load your kingdom data. This might be due to a database issue.</p>
        <p>Technical details: Game state is null despite loading being complete.</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '8px 16px', 
            border: '1px solid black',
            background: 'white',
            cursor: 'pointer',
            fontFamily: 'monospace',
            marginTop: '20px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  debug.log('HomePage', 'Rendering game interface', { 
    kingdomName: gameState.kingdom_name,
    activeTab
  });

  return (
    <>
      <Head>
        <title>Kingdom Management Game</title>
        <meta name="description" content="Medieval-themed Kingdom Management Game" />
      </Head>

      <div style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px',
        fontFamily: 'monospace'
      }}>
        {/* Game Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid black',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontWeight: 'normal' }}>Kingdom Management Game</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {gameState && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>💰</span>
                <span className="number-neutral">{gameState.resources.gold}</span>
                <span style={{ fontWeight: 'bold' }}>🍖</span>
                <span className="number-neutral">{gameState.resources.food}</span>
              </div>
            )}
            <button 
              onClick={handleSignOut} 
              style={{ 
                padding: '8px 16px', 
                border: '1px solid black',
                background: 'white',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div style={{ 
          border: '1px solid black', 
          padding: '20px',
          marginTop: '20px'
        }}>
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid black',
            marginBottom: '20px'
          }}>
            <div 
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'kingdom' ? '1px solid black' : 'none',
                fontWeight: activeTab === 'kingdom' ? 'bold' : 'normal'
              }}
              onClick={() => handleTabChange('kingdom')}
            >
              Kingdom
            </div>
            <div 
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'resources' ? '1px solid black' : 'none',
                fontWeight: activeTab === 'resources' ? 'bold' : 'normal'
              }}
              onClick={() => handleTabChange('resources')}
            >
              Resources
            </div>
            <div 
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'army' ? '1px solid black' : 'none',
                fontWeight: activeTab === 'army' ? 'bold' : 'normal'
              }}
              onClick={() => handleTabChange('army')}
            >
              Army
            </div>
            <div 
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'world' ? '1px solid black' : 'none',
                fontWeight: activeTab === 'world' ? 'bold' : 'normal'
              }}
              onClick={() => handleTabChange('world')}
            >
              World
            </div>
            <div 
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'war' ? '1px solid black' : 'none',
                fontWeight: activeTab === 'war' ? 'bold' : 'normal'
              }}
              onClick={() => handleTabChange('war')}
            >
              War
            </div>
          </div>

          {/* Tab Content */}
          {gameState && (
            <div>
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
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
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
