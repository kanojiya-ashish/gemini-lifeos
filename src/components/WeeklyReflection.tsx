import React, { useState } from 'react';
import { Sparkles, Calendar, TrendingUp, CheckCircle, AlertTriangle, Lightbulb, Compass, RefreshCw } from 'lucide-react';
import { InteractionDoc, InsightDoc } from '../types';
import { generateWeeklyReflection } from '../lib/gemini';
import { saveInsight } from '../lib/firebase';

interface WeeklyReflectionProps {
  userId: string;
  authToken: string;
  entries: InteractionDoc[];
  insights: InsightDoc[];
  onInsightGenerated: (insight: InsightDoc) => void;
}

export const WeeklyReflection: React.FC<WeeklyReflectionProps> = ({
  userId,
  authToken,
  entries,
  insights,
  onInsightGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedInsight, setSelectedInsight] = useState<InsightDoc | null>(
    insights.length > 0 ? insights[0] : null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateSynthesis = async () => {
    if (entries.length === 0) {
      setErrorMsg('You need at least 1 journal entry to generate a weekly synthesis.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const now = new Date();
      const currentWeekLabel = `Week of ${now.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

      const res = await generateWeeklyReflection(authToken, entries, currentWeekLabel);
      const raw = res.reflection;

      const newInsight: InsightDoc = {
        id: 'insight_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        type: 'weekly_reflection',
        title: raw.title || 'Weekly LifeOS Reflection',
        weekLabel: currentWeekLabel,
        accomplishments: raw.accomplishments || [],
        challenges: raw.challenges || [],
        keyThemes: raw.keyThemes || [],
        goalsIdentified: raw.goalsIdentified || [],
        suggestedFocusAreas: raw.suggestedFocusAreas || [],
        entriesAnalyzedCount: entries.length,
        generatedAt: Date.now(),
      };

      await saveInsight(userId, newInsight);
      onInsightGenerated(newInsight);
      setSelectedInsight(newInsight);
    } catch (err: any) {
      console.error('[GeminiLifeOS] Reflection synthesis error:', err);
      setErrorMsg(err?.message || 'Failed to synthesize reflection. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeInsight = selectedInsight || (insights.length > 0 ? insights[0] : null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Weekly AI Life Reflection
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Holistic intelligence synthesizing your journal logs, recurring challenges, and strategic priorities.
          </p>
        </div>

        <button
          id="generate-weekly-synthesis-btn"
          onClick={handleGenerateSynthesis}
          disabled={isGenerating || entries.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isGenerating ? 'Synthesizing LifeOS...' : 'Generate New Synthesis'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Synthesis Cycle Selector if multiple exist */}
      {insights.length > 1 && (
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-slate-400 font-medium shrink-0">Past Cycles:</span>
          {insights.map((ins) => (
            <button
              key={ins.id}
              onClick={() => setSelectedInsight(ins)}
              className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeInsight?.id === ins.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {ins.weekLabel}
            </button>
          ))}
        </div>
      )}

      {/* Main Insight Display */}
      {activeInsight ? (
        <div className="mt-6 space-y-6">
          {/* Top Banner Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-amber-400 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {activeInsight.weekLabel}
              </span>
              <span className="text-slate-400">
                Synthesized across {activeInsight.entriesAnalyzedCount} journal entries
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">{activeInsight.title}</h2>

            {/* Thematic Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {activeInsight.keyThemes.map((theme, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                >
                  #{theme}
                </span>
              ))}
            </div>
          </div>

          {/* 2-Column Quadrants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wins & Accomplishments */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4" /> Celebrated Accomplishments &amp; Wins
              </h3>
              <ul className="space-y-2">
                {activeInsight.accomplishments.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-300 leading-relaxed flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40"
                  >
                    <span className="text-emerald-500 mt-0.5">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Obstacles & Friction Points */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Recurring Challenges &amp; Friction Points
              </h3>
              <ul className="space-y-2">
                {activeInsight.challenges.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-300 leading-relaxed flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40"
                  >
                    <span className="text-rose-500 mt-0.5">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Focus Areas */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 md:col-span-2">
              <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4" /> High-Leverage Focus Priorities for Next Week
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeInsight.suggestedFocusAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-200 flex flex-col justify-between"
                  >
                    <span className="font-semibold text-indigo-300 mb-1">Priority #{idx + 1}</span>
                    <p className="leading-relaxed text-slate-300">{area}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/30 border border-slate-800/60 mt-6">
          <Sparkles className="w-10 h-10 text-amber-500/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Weekly Synthesis Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Write entries throughout your week, then click "Generate New Synthesis" above to have Gemini detect overarching life themes and growth opportunities.
          </p>
        </div>
      )}
    </div>
  );
};
