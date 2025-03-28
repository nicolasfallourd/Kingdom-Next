import React, { useEffect, useState } from 'react';

export default function Notification({ message, type = 'info' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Start fade-out animation after 2.5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`notification ${type}`}
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      {message}
    </div>
  );
}
