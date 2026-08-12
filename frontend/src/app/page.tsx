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
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-slate-950/90 text-slate-400 space-y-6 select-none relative overflow-hidden">
            {/* Background Ambient Glow Orbs */}
            <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />

            {/* Central Executive Welcome Dashboard Container */}
            <div className="relative z-10 max-w-xl w-full space-y-6">
              
              {/* Main Welcome Hero Card */}
              <div className="glass-card p-8 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6 backdrop-blur-2xl relative overflow-hidden">
                {/* Decorative Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                
                {/* Icon & User Greeting */}
                <div className="space-y-3">
                  <div className="relative w-16 h-16 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-3xl mx-auto shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                    ⚡
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-950 rounded-full" />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-extrabold text-blue-400 mb-1">
                      <span>👋 Welcome Back, {currentUser.username}!</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      NEXUS <span className="text-cyan-400">HQ</span> Workspace
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-md mx-auto">
                      Select any workspace group from the left sidebar to open real-time room chat, send messages, or view automated AI summaries.
                    </p>
                  </div>
                </div>

                {/* Status Grid Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-left">
                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black text-white">Socket.IO</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Live WebSockets</p>
                  </div>

                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-xs font-black text-white">Groq AI</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Daily Summaries</p>
                  </div>

                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-xs font-black text-white">BullMQ</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Worker Queues</p>
                  </div>

                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs font-black text-white">Security</span>
                    </div>
                    <p className="text-[10px] text-slate-400">JWT & OAuth</p>
                  </div>
                </div>

                {/* Sidebar Guidance Footer Bar */}
                <div className="pt-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-300 bg-slate-950/90 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👈</span>
                    <span>Select a room from the sidebar to chat</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Active Workspace</span>
                </div>
              </div>

              {/* User Account Info Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Signed in as <strong className="text-white">{currentUser.email}</strong></span>
                </div>
                <span>Role: <strong className="text-cyan-400 font-extrabold uppercase">Developer</strong></span>
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
