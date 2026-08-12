'use client';

import React, { useState } from 'react';
import { AuthForm } from '../components/AuthForm';
import { Sidebar, Group } from '../components/Sidebar';
import { ChatRoom } from '../components/ChatRoom';
import { LogoutModal } from '../components/LogoutModal';

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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

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
    setSelectedGroup(null);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    setToken(null);
    setCurrentUser(null);
    setSelectedGroup(null);
  };

  const handleGroupJoined = () => {
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
        onRequestLogout={() => setIsLogoutModalOpen(true)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
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
            onRequestLogout={() => setIsLogoutModalOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-slate-50 text-slate-600 space-y-6 select-none relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />

            {/* Central Welcome Card */}
            <div className="relative z-10 max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-950/5 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/25 mx-auto text-white">
                ⚡
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Welcome to NEXUS HQ
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Select a workspace group from the left sidebar to start collaborating, or click <span className="text-blue-600 font-bold">+ Create Group</span> to initiate a new room.
                </p>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-left">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-900">WebSockets</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Zero-latency live chat</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-900">Groq AI</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Daily chat summaries</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-extrabold text-blue-700 bg-blue-50 py-2.5 px-4 rounded-xl border border-blue-200">
                <span>👈</span>
                <span>Select a group from the sidebar to start</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Confirmation Modal for Sign Out */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </main>
  );
}
