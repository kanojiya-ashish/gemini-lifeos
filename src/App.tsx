import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Target,
  Clock,
  LogOut,
  Plus,
  Compass,
  Shield,
  Menu,
  X,
  User,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { LandingPage } from './components/LandingPage';
import { DashboardHome } from './components/DashboardHome';
import { JournalEditor } from './components/JournalEditor';
import { JournalHistory } from './components/JournalHistory';
import { GoalsTracker } from './components/GoalsTracker';
import { WeeklyReflection } from './components/WeeklyReflection';
import {
  loginWithGoogle,
  logoutUser,
  subscribeToAuthChanges,
  getUserAuthToken,
  syncUserProfile,
  fetchInteractions,
  fetchGoals,
  fetchInsights,
} from './lib/firebase';
import { InteractionDoc, GoalDoc, InsightDoc, JournalCategory } from './types';

type ActiveTab = 'dashboard' | 'editor' | 'history' | 'goals' | 'weekly_reflection';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // App Navigation & Selected State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedEntry, setSelectedEntry] = useState<InteractionDoc | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Application Data Isolated for this User
  const [entries, setEntries] = useState<InteractionDoc[]>([]);
  const [goals, setGoals] = useState<GoalDoc[]>([]);
  const [insights, setInsights] = useState<InsightDoc[]>([]);

  // Subscribe to Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      if (user) {
        const token = await getUserAuthToken(user);
        setAuthToken(token);
        await syncUserProfile(user);
        await loadUserData(user.uid);
      } else {
        setAuthToken('');
        setEntries([]);
        setGoals([]);
        setInsights([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      const [fetchedEntries, fetchedGoals, fetchedInsights] = await Promise.all([
        fetchInteractions(uid),
        fetchGoals(uid),
        fetchInsights(uid),
      ]);
      setEntries(fetchedEntries);
      setGoals(fetchedGoals);
      setInsights(fetchedInsights);
    } catch (err) {
      console.error('[GeminiLifeOS] Error loading user data:', err);
    }
  };

  const handleSignIn = async () => {
    setActionLoading(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      const token = await getUserAuthToken(user);
      setAuthToken(token);
      await syncUserProfile(user);
      await loadUserData(user.uid);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('[GeminiLifeOS] Sign-in error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    setCurrentUser(null);
    setAuthToken('');
    setActiveTab('dashboard');
  };

  const handleStartNewEntry = (category: JournalCategory = 'daily_reflection') => {
    setSelectedEntry({
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: currentUser?.uid || '',
      title: '',
      category,
      messages: [],
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setActiveTab('editor');
  };

  const handleOpenEntry = (entry: InteractionDoc) => {
    setSelectedEntry(entry);
    setActiveTab('editor');
  };

  const handleEntrySaved = (savedDoc: InteractionDoc) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== savedDoc.id);
      return [savedDoc, ...filtered];
    });
    setSelectedEntry(savedDoc);
  };

  const handleEntryDeleted = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setActiveTab('history');
    }
  };

  const handleGoalAdded = (newGoal: GoalDoc) => {
    setGoals((prev) => {
      const filtered = prev.filter((g) => g.id !== newGoal.id);
      return [newGoal, ...filtered];
    });
  };

  const handleInsightGenerated = (newInsight: InsightDoc) => {
    setInsights((prev) => [newInsight, ...prev]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider uppercase">Initializing Gemini LifeOS...</span>
      </div>
    );
  }

  // If unauthenticated, render the Landing Page
  if (!currentUser) {
    return <LandingPage onSignIn={handleSignIn} isLoading={actionLoading} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                Gemini LifeOS
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-dashboard-tab"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Dashboard
              </button>

              <button
                id="nav-history-tab"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Journal Vault ({entries.length})
              </button>

              <button
                id="nav-goals-tab"
                onClick={() => setActiveTab('goals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'goals'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Goals &amp; Actions ({goals.filter((g) => g.status === 'active').length})
              </button>

              <button
                id="nav-reflection-tab"
                onClick={() => setActiveTab('weekly_reflection')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'weekly_reflection'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Weekly Synthesis
              </button>
            </nav>
          </div>

          {/* User Controls & New Entry Button */}
          <div className="flex items-center gap-3">
            {activeTab !== 'editor' && (
              <button
                id="header-new-entry-btn"
                onClick={() => handleStartNewEntry()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Reflection</span>
              </button>
            )}

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="hidden lg:inline text-xs font-medium text-slate-300 max-w-[120px] truncate">
                {currentUser.displayName || currentUser.email || 'User'}
              </span>
              <button
                id="auth-logout-btn"
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-900"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-900"
            >
              Journal Vault ({entries.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('goals');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-900"
            >
              Goals &amp; Actions ({goals.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('weekly_reflection');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-900"
            >
              Weekly Synthesis
            </button>
            <button
              onClick={() => {
                handleStartNewEntry();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-center px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white mt-2"
            >
              + New Reflection
            </button>
          </div>
        )}
      </header>

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardHome
            userDisplayName={currentUser.displayName || 'Friend'}
            entries={entries}
            goals={goals}
            insights={insights}
            onNewEntry={(category) => handleStartNewEntry(category)}
            onOpenEntry={handleOpenEntry}
            onViewHistory={() => setActiveTab('history')}
            onViewGoals={() => setActiveTab('goals')}
            onViewReflections={() => setActiveTab('weekly_reflection')}
          />
        )}

        {activeTab === 'editor' && (
          <JournalEditor
            userId={currentUser.uid}
            authToken={authToken}
            initialInteraction={selectedEntry}
            onBack={() => setActiveTab('dashboard')}
            onSaved={handleEntrySaved}
            onGoalAdded={handleGoalAdded}
          />
        )}

        {activeTab === 'history' && (
          <JournalHistory
            userId={currentUser.uid}
            entries={entries}
            onOpenEntry={handleOpenEntry}
            onEntryDeleted={handleEntryDeleted}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsTracker
            userId={currentUser.uid}
            goals={goals}
            onGoalsUpdated={() => loadUserData(currentUser.uid)}
          />
        )}

        {activeTab === 'weekly_reflection' && (
          <WeeklyReflection
            userId={currentUser.uid}
            authToken={authToken}
            entries={entries}
            insights={insights}
            onInsightGenerated={handleInsightGenerated}
          />
        )}
      </main>
    </div>
  );
}
