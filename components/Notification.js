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

  // Extract numbers from the message to apply color styling
  const formatMessage = (text) => {
    // Split the message by spaces and check each part
    return text.split(' ').map((part, index) => {
      // Check if this part contains a number
      const hasNumber = /\d+/.test(part);
      if (hasNumber) {
        // If it's a negative number, use negative color
        if (part.includes('-')) {
          return <span key={index} className="number-negative">{part} </span>;
        }
        // For positive numbers or neutral numbers
        return <span key={index} className="number-neutral">{part} </span>;
      }
      // Return regular text
      return <span key={index}>{part} </span>;
    });
  };

  return (
    <div 
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
        padding: '10px',
        border: '1px solid black',
        backgroundColor: 'white',
        fontFamily: 'monospace',
        marginBottom: '10px'
      }}
    >
      {formatMessage(message)}
    </div>
  );
}
