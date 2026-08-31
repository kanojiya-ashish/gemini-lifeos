import { ChatMessage, JournalCategory, GoalDoc, InsightDoc, InteractionDoc } from '../types';

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
  reply?: string;
  goals?: any[];
  reflection?: any;
  entriesAnalyzedCount?: number;
  modelUsed?: string;
}

async function fetchWithAuth<T>(endpoint: string, authToken: string, body: any): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export async function sendJournalChatMessage(
  authToken: string,
  messages: ChatMessage[],
  category: JournalCategory,
  userTitle?: string
): Promise<{ reply: string; modelUsed: string }> {
  const res = await fetchWithAuth<ApiResponse<any>>('/api/gemini/chat', authToken, {
    messages,
    category,
    userTitle,
  });

  return {
    reply: res.reply || 'No response generated.',
    modelUsed: res.modelUsed || 'gemini-2.5-flash',
  };
}

export async function summarizeJournalEntry(
  authToken: string,
  messages: ChatMessage[],
  title: string
): Promise<{ summary: string; sentiment: any; tags: string[]; modelUsed: string }> {
  const res = await fetchWithAuth<ApiResponse<any>>('/api/gemini/summarize', authToken, {
    messages,
    title,
  });

  return {
    summary: res.data?.summary || 'Summary unavailable.',
    sentiment: res.data?.sentiment || 'reflective',
    tags: res.data?.tags || ['Reflection'],
    modelUsed: res.modelUsed || 'gemini-2.5-flash',
  };
}

export async function extractGoalsFromEntry(
  authToken: string,
  messages: ChatMessage[],
  entryTitle: string
): Promise<{ goals: Array<{ title: string; description: string; targetCategory: any }>; modelUsed: string }> {
  const res = await fetchWithAuth<ApiResponse<any>>('/api/gemini/extract-goals', authToken, {
    messages,
    entryTitle,
  });

  return {
    goals: res.goals || [],
    modelUsed: res.modelUsed || 'gemini-2.5-flash',
  };
}

export async function generateWeeklyReflection(
  authToken: string,
  entries: InteractionDoc[],
  timeRangeLabel: string = 'Past 7 Days'
): Promise<{ reflection: any; modelUsed: string }> {
  const res = await fetchWithAuth<ApiResponse<any>>('/api/gemini/weekly-reflection', authToken, {
    entries,
    timeRangeLabel,
  });

  return {
    reflection: res.reflection,
    modelUsed: res.modelUsed || 'gemini-2.5-flash',
  };
}
