import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Circle, Archive, Trash2, Calendar, Sparkles } from 'lucide-react';
import { GoalDoc, GoalStatus, GoalCategory } from '../types';
import { saveGoal, deleteGoal } from '../lib/firebase';

interface GoalsTrackerProps {
  userId: string;
  goals: GoalDoc[];
  onGoalsUpdated: () => void;
}

export const GoalsTracker: React.FC<GoalsTrackerProps> = ({
  userId,
  goals,
  onGoalsUpdated,
}) => {
  const [filter, setFilter] = useState<GoalStatus | 'all'>('active');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [targetCategory, setTargetCategory] = useState<GoalCategory>('personal');
  const [targetDate, setTargetDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    const newGoal: GoalDoc = {
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      title: title.trim(),
      description: description.trim(),
      targetCategory,
      status: 'active',
      extractedDate: Date.now(),
      targetDate: targetDate || undefined,
      progress: 0,
    };

    await saveGoal(userId, newGoal);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setIsCreating(false);
    setIsSaving(false);
    onGoalsUpdated();
  };

  const handleToggleStatus = async (goal: GoalDoc) => {
    const nextStatus: GoalStatus = goal.status === 'completed' ? 'active' : 'completed';
    const updated: GoalDoc = {
      ...goal,
      status: nextStatus,
      progress: nextStatus === 'completed' ? 100 : goal.progress,
    };
    await saveGoal(userId, updated);
    onGoalsUpdated();
  };

  const handleUpdateProgress = async (goal: GoalDoc, progress: number) => {
    const isNowDone = progress >= 100;
    const updated: GoalDoc = {
      ...goal,
      progress,
      status: isNowDone ? 'completed' : goal.status === 'completed' ? 'active' : goal.status,
    };
    await saveGoal(userId, updated);
    onGoalsUpdated();
  };

  const handleDelete = async (goalId: string) => {
   if (confirm('Are you sure you want to delete this goal?')) {
    await deleteGoal(userId, goalId);
    onGoalsUpdated();
   }
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === 'all') return true;
    return g.status === filter;
  });

  const activeCount = goals.filter((g) => g.status === 'active').length;
  const completedCount = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-400" />
            AI Action Goals &amp; Commitments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track intentions and actionable goals extracted from your Gemini reflections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="create-new-goal-btn"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Stats */}
      <div className="flex items-center justify-between mt-6 mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(['active', 'completed', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab} ({tab === 'active' ? activeCount : tab === 'completed' ? completedCount : goals.length})
            </button>
          ))}
        </div>
      </div>

      {/* Modal / Inline Goal Creator */}
      {isCreating && (
        <form
          onSubmit={handleCreateGoal}
          className="mb-8 p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl"
        >
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Create Custom Life Goal
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Goal Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Read 20 pages of deep work every morning"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Description / Action Steps
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details on why this matters and how to execute..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value as GoalCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="personal">Personal Growth</option>
                  <option value="career">Career &amp; Craft</option>
                  <option value="health">Health &amp; Energy</option>
                  <option value="habits">Habits &amp; Routine</option>
                  <option value="mindset">Mindset &amp; Philosophy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Target Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      )}

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/30 border border-slate-800/60">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Goals Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Write reflection entries in your journal to have Gemini automatically detect action goals, or create one manually above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((g) => (
            <div
              key={g.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                g.status === 'completed'
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(g)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-400 cursor-pointer"
                      title={g.status === 'completed' ? 'Mark Active' : 'Mark Completed'}
                    >
                      {g.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3
                        className={`text-sm font-semibold ${
                          g.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {g.title}
                      </h3>
                      {g.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {g.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-800 text-slate-300">
                    {g.targetCategory}
                  </span>
                  {g.targetDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {g.targetDate}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={g.progress}
                    onChange={(e) => handleUpdateProgress(g, Number(e.target.value))}
                    className="w-16 accent-indigo-500 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] w-7 text-right">{g.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
