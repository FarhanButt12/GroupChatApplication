'use client';

import React, { useState, useEffect } from 'react';
import { AuthForm } from '../components/AuthForm';
import { Sidebar, Group } from '../components/Sidebar';
import { ChatRoom } from '../components/ChatRoom';

interface User {
  id: string;
  username: string;
  email: string;
}

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  const handleAuthSuccess = (authToken: string, user: User) => {
    setToken(authToken);
    setCurrentUser(user);
    // Explicitly set selectedGroup to null on login per requirements so it does NOT auto-open any group!
    setSelectedGroup(null);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setSelectedGroup(null);
  };

  const handleGroupJoined = () => {
    // Trigger sidebar re-fetch to update lock icons dynamically from 🔒 to 🔓
    setRefreshKey((prev) => prev + 1);
  };

  if (!token || !currentUser) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <main className="h-screen w-screen flex overflow-hidden bg-slate-950 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        key={refreshKey}
        token={token}
        currentUser={currentUser}
        selectedGroup={selectedGroup}
        onSelectGroup={(group) => setSelectedGroup(group)}
        onLogout={handleLogout}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Right Main Chat Window Area */}
      <section className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedGroup ? (
          <ChatRoom
            key={selectedGroup.id}
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
            groupDescription={selectedGroup.description}
            token={token}
            currentUserId={currentUser.id}
            currentUsername={currentUser.username}
            onJoined={handleGroupJoined}
            onLogout={handleLogout}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center glass-main text-slate-500 space-y-4 select-none relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            <div className="w-20 h-20 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-4xl shadow-2xl z-10">
              👈
            </div>
            <div className="z-10 max-w-sm space-y-1">
              <h2 className="text-base font-extrabold text-white">No Channel Selected</h2>
              <p className="text-xs text-slate-400">
                Select a channel from the left sidebar to start chatting or join a new group conversation.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
