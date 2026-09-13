// ---------------- SERVER-SIDE INPUT VALIDATION ----------------
// Centralized, reusable validation helpers for all /api/gemini/* routes.
// All limits are defined in LIMITS for single-place auditability.

export const LIMITS = {
  MESSAGES_MAX_COUNT:        100,   // max messages per conversation sent to Gemini
  MESSAGE_CONTENT_MAX_CHARS: 8_000, // max characters per individual message content string
  TITLE_MAX_CHARS:           200,   // max chars for entry titles / labels
  TIMELABEL_MAX_CHARS:       100,   // max chars for timeRangeLabel
  ENTRIES_MAX_COUNT:          20,   // max journal entries for weekly-reflection
  ENTRY_SUMMARY_MAX_CHARS:   1_000, // max chars for a pre-existing entry summary field
} as const;

// Valid journal category values — mirrors the JournalCategory union in src/types.ts.
const VALID_CATEGORIES = new Set([
  'daily_reflection',
  'brainstorm',
  'goal_planning',
  'freeform',
  'decision_making',
]);

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a single raw message object.
 * - role: optional. If present and non-null, must be one of: user, model, assistant.
 *   Invalid provided roles are rejected — not silently converted — because an
 *   arbitrary role value can be used to inject fake structural framing into the
 *   assembled prompt transcript.  An absent or null role is allowed for backward
 *   compatibility with clients that omit the field.
 * - content: optional. If present and non-null, must be a string within the
 *   character limit.
 * Returns a ValidationError or null.
 */
// Roles the application recognises.  Matches the Gemini SDK canonical name
// ('model'), the OpenAI-convention alias ('assistant') already normalised by
// the /chat route, and the user turn ('user').
const VALID_ROLES = new Set(['user', 'model', 'assistant']);

function validateMessageObject(m: unknown, fieldPath: string): ValidationError | null {
  if (!m || typeof m !== 'object') {
    return { field: fieldPath, message: `${fieldPath} must be an object.` };
  }
  const role = (m as any).role;
  if (role !== undefined && role !== null) {
    if (!VALID_ROLES.has(role)) {
      return {
        field: `${fieldPath}.role`,
        message: `${fieldPath}.role must be one of: user, model, assistant.`,
      };
    }
  }
  const content = (m as any).content;
  if (content !== undefined && content !== null) {
    if (typeof content !== 'string') {
      return {
        field: `${fieldPath}.content`,
        message: `${fieldPath}.content must be a string.`,
      };
    }
    if (content.length > LIMITS.MESSAGE_CONTENT_MAX_CHARS) {
      return {
        field: `${fieldPath}.content`,
        message: `${fieldPath}.content exceeds maximum of ${LIMITS.MESSAGE_CONTENT_MAX_CHARS} characters.`,
      };
    }
  }
  return null;
}

/**
 * Validates the messages array sent to /chat, /summarize, and /extract-goals.
 * Returns a ValidationError if invalid, or null if valid.
 */
export function validateMessages(messages: unknown): ValidationError | null {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { field: 'messages', message: 'messages must be a non-empty array.' };
  }
  if (messages.length > LIMITS.MESSAGES_MAX_COUNT) {
    return {
      field: 'messages',
      message: `messages array exceeds maximum of ${LIMITS.MESSAGES_MAX_COUNT} items.`,
    };
  }
  for (let i = 0; i < messages.length; i++) {
    const err = validateMessageObject(messages[i], `messages[${i}]`);
    if (err) return err;
  }
  return null;
}

/**
 * Validates a title/label string field.
 * A missing, null, or empty value is allowed (routes supply their own defaults).
 * Returns a ValidationError if invalid, or null if valid.
 */
export function validateTitle(
  value: unknown,
  fieldName: string,
  maxChars: number,
): ValidationError | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    return { field: fieldName, message: `${fieldName} must be a string.` };
  }
  if (value.length > maxChars) {
    return {
      field: fieldName,
      message: `${fieldName} exceeds maximum of ${maxChars} characters.`,
    };
  }
  return null;
}

/**
 * Validates a category field against the known JournalCategory values.
 * A missing or empty value is allowed (routes supply their own defaults).
 * Returns a ValidationError if invalid, or null if valid.
 */
export function validateCategory(value: unknown, fieldName: string): ValidationError | null {
  if (value === undefined || value === '') return null;
  if (!VALID_CATEGORIES.has(value as string)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${[...VALID_CATEGORIES].join(', ')}.`,
    };
  }
  return null;
}

/**
 * Validates the entries array sent to /weekly-reflection.
 * Checks entry count, per-entry field lengths, nested message count, and
 * requires nested message content to be a string before applying length limits.
 * Returns a ValidationError if invalid, or null if valid.
 */
export function validateEntries(entries: unknown): ValidationError | null {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { field: 'entries', message: 'entries must be a non-empty array.' };
  }
  if (entries.length > LIMITS.ENTRIES_MAX_COUNT) {
    return {
      field: 'entries',
      message: `entries array exceeds maximum of ${LIMITS.ENTRIES_MAX_COUNT} items.`,
    };
  }
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry || typeof entry !== 'object') {
      return { field: `entries[${i}]`, message: `entries[${i}] must be an object.` };
    }
    const e = entry as any;

    const titleErr = validateTitle(e.title, `entries[${i}].title`, LIMITS.TITLE_MAX_CHARS);
    if (titleErr) return titleErr;

    const summaryErr = validateTitle(e.summary, `entries[${i}].summary`, LIMITS.ENTRY_SUMMARY_MAX_CHARS);
    if (summaryErr) return summaryErr;

    const catErr = validateCategory(e.category, `entries[${i}].category`);
    if (catErr) return catErr;

    if (e.messages !== undefined) {
      if (!Array.isArray(e.messages)) {
        return { field: `entries[${i}].messages`, message: `entries[${i}].messages must be an array.` };
      }
      // Cap nested message count before iterating
      if (e.messages.length > LIMITS.MESSAGES_MAX_COUNT) {
        return {
          field: `entries[${i}].messages`,
          message: `entries[${i}].messages exceeds maximum of ${LIMITS.MESSAGES_MAX_COUNT} items.`,
        };
      }
      for (let j = 0; j < e.messages.length; j++) {
        const err = validateMessageObject(e.messages[j], `entries[${i}].messages[${j}]`);
        if (err) return err;
      }
    }
  }
  return null;
}
