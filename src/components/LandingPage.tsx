import React from 'react';
import { Sparkles, Shield, Compass, Target, ArrowRight, Lock, Key, Database, Cpu } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isLoading }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 backdrop-blur-md bg-slate-950/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-white flex items-center gap-1.5 text-base">
                Gemini LifeOS
                <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Cloud Native
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-signin-btn-top"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all rounded-lg shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-16 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-8">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Knowledge Client Architecture &bull; Strict Owner-Bound Firestore Isolation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          A Private Life Operating System Powered by{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-300 to-amber-200">
            Gemini 3.6 Flash
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Reflect deeply with multi-turn AI dialogues, synthesize complex emotions, extract concrete goals, and cultivate personal breakthroughs in a securely isolated vault.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="hero-get-started-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all rounded-xl shadow-xl shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Get Started with Google Auth</span>
            <ArrowRight className="w-4 h-4 text-indigo-200" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">Multi-Turn AI Reflections</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Converse with Gemini 3.6 Flash through empathetic, philosophical dialogues that help clarify thoughts, unpack complex decisions, and build emotional resilience.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Goal Extraction</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Transform unstructured journal reflections into crisp, actionable goals with automated categories, deadlines, and progress tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">Weekly Synthesis & Insights</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Detect recurring emotional threads, celebrate accomplishments, and receive high-leverage strategic focus areas synthesized across all your entries.
            </p>
          </div>
        </div>

        {/* Security Architecture Callout */}
        <div className="mt-12 w-full p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Production Security Architecture</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xl">
                Server-side Secret Manager credential handling, zero client-exposed API keys, resilient fallback model ladder, and owner-bound Firestore security rules ensuring 100% tenant isolation.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400 shrink-0">
            <span className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/50 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" /> Secret Manager
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/50 flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-400" /> Cloud Firestore
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/50 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" /> Cloud Run
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Gemini LifeOS &bull; Built for Google Cloud Run &amp; Gemini AI Challenge</p>
      </footer>
    </div>
  );
};
