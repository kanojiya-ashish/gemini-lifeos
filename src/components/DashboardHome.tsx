import React from 'react';
import { Sparkles, Plus, BookOpen, Target, ArrowRight, ShieldCheck, Compass, MessageSquare } from 'lucide-react';
import { InteractionDoc, GoalDoc, InsightDoc } from '../types';

interface DashboardHomeProps {
  userDisplayName: string;
  entries: InteractionDoc[];
  goals: GoalDoc[];
  insights: InsightDoc[];
  onNewEntry: (category?: any) => void;
  onOpenEntry: (entry: InteractionDoc) => void;
  onViewHistory: () => void;
  onViewGoals: () => void;
  onViewReflections: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  userDisplayName,
  entries,
  goals,
  insights,
  onNewEntry,
  onOpenEntry,
  onViewHistory,
  onViewGoals,
  onViewReflections,
}) => {
  const activeGoals = goals.filter((g) => g.status === 'active');
  const recentEntries = entries.slice(0, 3);
  const latestInsight = insights.length > 0 ? insights[0] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome & Quick Action Hero */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Life Strategist Ready</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {userDisplayName || 'Friend'}.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            What is currently engaging your attention? Unpack a thought, navigate a choice, or reflect on your day with Gemini.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              id="dashboard-new-journal-btn"
              onClick={() => onNewEntry('daily_reflection')}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Reflection</span>
            </button>

            <button
              onClick={() => onNewEntry('brainstorm')}
              className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Brainstorm Ideas</span>
            </button>
          </div>
        </div>

        {/* Subtle ambient gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Reflections</span>
          <div className="text-2xl font-bold text-white mt-1">{entries.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Active Goals</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{activeGoals.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Weekly Insights</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{insights.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Security Isolation</span>
          <div className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Owner-Bound
          </div>
        </div>
      </div>

      {/* 2-Column Core Dashboard: Recent Reflections & Active Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reflections Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Recent Journal Entries
            </h2>
            {entries.length > 0 && (
              <button
                onClick={onViewHistory}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                View all ({entries.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentEntries.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No reflections logged yet.</p>
              <button
                onClick={() => onNewEntry()}
                className="mt-3 text-xs font-semibold text-indigo-400 hover:underline cursor-pointer"
              >
                Create your first journal entry &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => onOpenEntry(entry)}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-indigo-500/10 text-indigo-400">
                      {entry.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-2 group-hover:text-indigo-300 transition-colors">
                    {entry.title || 'Untitled Reflection'}
                  </h3>
                  {entry.summary && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {entry.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Active Goals & Latest AI Insight */}
        <div className="space-y-6">
          {/* Active Goals Box */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> Active Goals
              </h2>
              <button
                onClick={onViewGoals}
                className="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No active goals. Have Gemini extract goals from your reflections!
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeGoals.slice(0, 4).map((g) => (
                  <div key={g.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200 truncate">{g.title}</span>
                      <span className="text-[10px] font-mono text-indigo-400">{g.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Weekly Insight Preview */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Weekly Synthesis
              </h2>
              <button
                onClick={onViewReflections}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                View Details
              </button>
            </div>

            {latestInsight ? (
              <div>
                <p className="text-xs font-semibold text-white">{latestInsight.title}</p>
                <div className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {latestInsight.accomplishments[0] || latestInsight.suggestedFocusAreas[0]}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No weekly reflection generated yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
