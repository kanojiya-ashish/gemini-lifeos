import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Target, Tag, ArrowLeft, RefreshCw, CheckCircle2, BookmarkPlus, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InteractionDoc, ChatMessage, JournalCategory, GoalDoc } from '../types';
import { sendJournalChatMessage, summarizeJournalEntry, extractGoalsFromEntry } from '../lib/gemini';
import { saveInteraction, saveGoal } from '../lib/firebase';

interface JournalEditorProps {
  userId: string;
  authToken: string;
  initialInteraction?: InteractionDoc | null;
  onBack: () => void;
  onSaved: (interaction: InteractionDoc) => void;
  onGoalAdded?: (goal: GoalDoc) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  authToken,
  initialInteraction,
  onBack,
  onSaved,
  onGoalAdded,
}) => {
  const [interactionId] = useState<string>(
    initialInteraction?.id || 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  );
  const [title, setTitle] = useState<string>(initialInteraction?.title || '');
  const [category, setCategory] = useState<JournalCategory>(
    initialInteraction?.category || 'daily_reflection'
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialInteraction?.messages || []);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isExtractingGoals, setIsExtractingGoals] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>(initialInteraction?.summary || '');
  const [tags, setTags] = useState<string[]>(initialInteraction?.tags || []);
  const [extractedGoals, setExtractedGoals] = useState<Array<{ title: string; description: string; targetCategory: any }>>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [tagInput, setTagInput] = useState<string>('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Persist interaction snapshot helper
  const persistState = async (updatedMessages: ChatMessage[], newSummary?: string, newTags?: string[]) => {
    const docToSave: InteractionDoc = {
      id: interactionId,
      userId,
      title: title.trim() || 'Untitled Reflection',
      category,
      messages: updatedMessages,
      summary: newSummary !== undefined ? newSummary : summary,
      tags: newTags !== undefined ? newTags : tags,
      createdAt: initialInteraction?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveInteraction(userId, docToSave);
    onSaved(docToSave);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      role: 'user',
      content: cleanText,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsSending(true);
    setStatusMessage(null);

    // Save prompt immediately
    await persistState(newMessages);

    try {
      const response = await sendJournalChatMessage(
        authToken,
        newMessages,
        category,
        title || 'Untitled Reflection'
      );

      const aiMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        role: 'model',
        content: response.reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      await persistState(finalMessages);

      // Auto-extract title if still empty
      if (!title.trim()) {
        const autoTitle = cleanText.length > 40 ? cleanText.slice(0, 37) + '...' : cleanText;
        setTitle(autoTitle);
      }
    } catch (err: any) {
      console.error('[GeminiLifeOS] Chat error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to connect to Gemini API. Please retry.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (messages.length === 0) {
      setStatusMessage({ type: 'info', text: 'Write a journal entry or prompt first to generate a summary.' });
      return;
    }

    setIsSummarizing(true);
    setStatusMessage(null);
    try {
      const result = await summarizeJournalEntry(authToken, messages, title || 'Journal Reflection');
      setSummary(result.summary);
      const combinedTags = Array.from(new Set([...tags, ...result.tags]));
      setTags(combinedTags);
      await persistState(messages, result.summary, combinedTags);
      setStatusMessage({ type: 'success', text: 'Summary synthesized and saved!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Summarization failed.' });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExtractGoals = async () => {
    if (messages.length === 0) {
      setStatusMessage({ type: 'info', text: 'Add entries to your journal before extracting goals.' });
      return;
    }

    setIsExtractingGoals(true);
    setStatusMessage(null);
    try {
      const res = await extractGoalsFromEntry(authToken, messages, title || 'Journal Reflection');
      setExtractedGoals(res.goals);
      setStatusMessage({
        type: 'success',
        text: res.goals.length > 0
          ? `Gemini identified ${res.goals.length} actionable goal(s)!`
          : 'No specific goals detected in this entry.',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Goal extraction failed.' });
    } finally {
      setIsExtractingGoals(false);
    }
  };

  const handleSaveGoalToTracker = async (g: { title: string; description: string; targetCategory: any }) => {
    const newGoal: GoalDoc = {
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      sourceInteractionId: interactionId,
      title: g.title,
      description: g.description,
      targetCategory: g.targetCategory || 'personal',
      status: 'active',
      extractedDate: Date.now(),
      progress: 0,
    };

    await saveGoal(userId, newGoal);
    if (onGoalAdded) onGoalAdded(newGoal);
    setExtractedGoals((prev) => prev.filter((item) => item.title !== g.title));
    setStatusMessage({ type: 'success', text: `Goal "${g.title}" added to your LifeOS Goals!` });
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      const updatedTags = [...tags, clean];
      setTags(updatedTags);
      setTagInput('');
      persistState(messages, summary, updatedTags);
    }
  };

  const handleRemoveTag = (t: string) => {
    const updated = tags.filter((item) => item !== t);
    setTags(updated);
    persistState(messages, summary, updated);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 py-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <button
            id="editor-back-btn"
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            id="journal-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persistState(messages)}
            placeholder="Journal Reflection Title..."
            className="text-lg font-semibold bg-transparent text-white placeholder-slate-500 border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none px-1 py-0.5 w-full max-w-md transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            id="journal-category-select"
            value={category}
            onChange={(e) => {
              const newCat = e.target.value as JournalCategory;
              setCategory(newCat);
              persistState(messages);
            }}
            className="text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="daily_reflection">Daily Reflection</option>
            <option value="brainstorm">Brainstorming</option>
            <option value="goal_planning">Goal Planning</option>
            <option value="decision_making">Decision Making</option>
            <option value="freeform">Freeform Thoughts</option>
          </select>

          <button
            id="journal-summarize-btn"
            onClick={handleGenerateSummary}
            disabled={isSummarizing || messages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Generate AI Summary"
          >
            {isSummarizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span>Summarize</span>
          </button>

          <button
            id="journal-extract-goals-btn"
            onClick={handleExtractGoals}
            disabled={isExtractingGoals || messages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-xs font-medium text-indigo-300 hover:bg-indigo-900 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Extract AI Action Goals"
          >
            {isExtractingGoals ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Target className="w-3.5 h-3.5 text-indigo-400" />}
            <span>Extract Goals</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-center justify-between border ${
            statusMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              : statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : 'bg-sky-950/60 border-sky-800/80 text-sky-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline opacity-70 hover:opacity-100 cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 mt-3 overflow-hidden">
        {/* Chat / Interaction Panel */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-8">
                <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center text-indigo-400 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-300">Start Your Reflection</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Write freely about your day, challenges, ideas, or questions. Gemini will reflect with you in real-time.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md">
                  {[
                    "What's on your mind today?",
                    "I want to unpack a difficult decision...",
                    "Help me brainstorm next quarter goals",
                    "Feeling overwhelmed with priorities",
                  ].map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputText(starter);
                      }}
                      className="px-2.5 py-1 text-xs rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-colors cursor-pointer"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                    <span className="font-medium">
                      {m.role === 'user' ? 'You' : 'Gemini Companion'}
                    </span>
                    <span>&bull;</span>
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/10'
                        : 'bg-slate-800/90 text-slate-100 rounded-tl-sm border border-slate-700/60'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isSending && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
                <div className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse delay-300" />
                <span className="ml-1 text-slate-400">Gemini is reflecting...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-end gap-2"
          >
            <textarea
              id="journal-chat-textarea"
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Reflect, write, or ask Gemini something... (Press Enter to send)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              id="journal-chat-send-btn"
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              title="Send to Gemini"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Sidebar: Summary, Extracted Goals & Tags */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Executive Summary
              </span>
            </div>
            {summary ? (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                {summary}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No summary generated yet. Click "Summarize" once you have written your thoughts.
              </p>
            )}
          </div>

          {/* AI Extracted Goals Box */}
          {extractedGoals.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-indigo-400" /> Extracted Goals
              </span>
              <div className="space-y-2">
                {extractedGoals.map((g, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/90 border border-indigo-800/50 text-xs">
                    <div className="font-semibold text-white">{g.title}</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{g.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {g.targetCategory}
                      </span>
                      <button
                        onClick={() => handleSaveGoalToTracker(g)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Track Goal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Box */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-sky-400" /> Topics &amp; Tags
            </span>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300"
                >
                  #{t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add custom tag..."
                className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddTag}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
