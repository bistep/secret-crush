import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ChatsWithMePage from './pages/ChatsWithMePage';
import MyProfilePage from './pages/MyProfilePage';
import OwnerInboxPage from './pages/OwnerInboxPage';
import TermsPage from './pages/TermsPage';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#0A0812] text-slate-100">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat/:personaId" element={<ChatPage />} />
                <Route path="/chats" element={<ChatsWithMePage />} />
                <Route path="/profile" element={<MyProfilePage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/owner" element={<OwnerInboxPage />} />
                <Route path="/owner/inbox" element={<OwnerInboxPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <BottomNav />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
