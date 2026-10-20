import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { visitorId, ownerToken, isOwnerLoggedIn } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadOwnerCount, setUnreadOwnerCount] = useState(0);

  useEffect(() => {
    // Connect to server (using window.location.origin in prod or vite proxy)
    const socketUrl = window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join visitor room
      if (visitorId) {
        newSocket.emit('visitor:join', { visitorId });
      }
      // If owner is logged in, join owner room
      if (ownerToken) {
        newSocket.emit('owner:join', { token: ownerToken });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [visitorId]);

  // Re-join owner room if owner logs in
  useEffect(() => {
    if (socket && isConnected && ownerToken) {
      socket.emit('owner:join', { token: ownerToken });
    }
  }, [socket, isConnected, ownerToken]);

  // Play subtle romantic notification chime using Web Audio API
  const playSoundAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext not allowed before user interaction
    }
  };

  const sendMessage = (personaId, content, type = 'text') => {
    if (socket && isConnected) {
      socket.emit('visitor:send_message', {
        visitorId,
        personaId,
        content,
        type
      });
    } else {
      // Fallback to REST
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, personaId, content, type })
      }).catch(err => console.log('Message send fallback:', err.message));
    }
  };

  const sendOwnerReply = (targetVisitorId, personaId, content, type = 'text') => {
    if (socket && isConnected) {
      socket.emit('owner:send_reply', {
        visitorId: targetVisitorId,
        personaId,
        content,
        type
      });
    } else {
      fetch('/api/owner/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': ownerToken
        },
        body: JSON.stringify({
          conversationId: `${targetVisitorId}_${personaId}`,
          content,
          type
        })
      }).catch(err => console.log('Owner reply fallback:', err.message));
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage,
        sendOwnerReply,
        playSoundAlert,
        unreadOwnerCount,
        setUnreadOwnerCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
