import React, { useState } from 'react';
import { Search, Filter, BookOpen, Trash2, Calendar, Sparkles, MessageSquare, Tag } from 'lucide-react';
import { InteractionDoc, JournalCategory } from '../types';
import { deleteInteraction } from '../lib/firebase';

interface JournalHistoryProps {
  userId: string;
  entries: InteractionDoc[];
  onOpenEntry: (entry: InteractionDoc) => void;
  onEntryDeleted: (id: string) => void;
}

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  userId,
  entries,
  onOpenEntry,
  onEntryDeleted,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags across entries
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []).filter(Boolean))
  );

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.summary && e.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

    const matchesTag = !selectedTag || (e.tags && e.tags.includes(selectedTag));

    return matchesSearch && matchesCategory && matchesTag;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this journal entry from your isolated Firestore?')) {
      await deleteInteraction(userId, id);
      onEntryDeleted(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Journal History &amp; Reflections Vault
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and reopen your private reflections and multi-turn conversations.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mt-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="journal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections by keywords, insights, topics..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 w-full md:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="daily_reflection">Daily Reflection</option>
            <option value="brainstorm">Brainstorming</option>
            <option value="goal_planning">Goal Planning</option>
            <option value="decision_making">Decision Making</option>
            <option value="freeform">Freeform</option>
          </select>
        </div>
      </div>

      {/* Tag Pills */}
      {allTags.length > 0 && (
        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1">
            Filter by Tag:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-0.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-rose-400 hover:underline ml-2 cursor-pointer"
            >
              Clear tag
            </button>
          )}
        </div>
      )}

      {/* Entries List */}
      <div className="mt-6 space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/30 border border-slate-800/60">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Journal Entries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery || categoryFilter !== 'all' || selectedTag
                ? 'Try adjusting your search criteria or tag filters.'
                : 'Create your first journal reflection on the dashboard!'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onOpenEntry(entry)}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {entry.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {entry.messages.length} messages
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                  {entry.title || 'Untitled Reflection'}
                </h3>

                {entry.summary ? (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {entry.summary}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                    {entry.messages[0]?.content || 'Empty entry'}
                  </p>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {entry.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900 transition-colors cursor-pointer"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
