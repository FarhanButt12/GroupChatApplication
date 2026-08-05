'use client';

import React, { useState } from 'react';
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

  const handleAuthSuccess = (authToken: string, user: User) => {
    setToken(authToken);
    setCurrentUser(user);
    // Explicitly set selectedGroup to null on login so it does NOT auto-open any group!
    setSelectedGroup(null);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setSelectedGroup(null);
  };

  const handleGroupJoined = () => {
    // Trigger sidebar re-fetch to update lock icons dynamically
    setRefreshKey((prev) => prev + 1);
  };

  if (!token || !currentUser) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <main className="h-screen w-screen flex overflow-hidden bg-slate-950 font-sans">
      {/* Left Sidebar with key to refresh lock status when joining */}
      <Sidebar
        key={refreshKey}
        token={token}
        currentUser={currentUser}
        selectedGroup={selectedGroup}
        onSelectGroup={(group) => setSelectedGroup(group)}
        onLogout={handleLogout}
      />

      {/* Right Main Chat Area */}
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center chat-bg text-slate-500 space-y-3 select-none">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shadow-xl">
              👈
            </div>
            <h2 className="text-sm font-bold text-white">No Channel Selected</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              Select a channel from the left sidebar to view messages or join the conversation.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
