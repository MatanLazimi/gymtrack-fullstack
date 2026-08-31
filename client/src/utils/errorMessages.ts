import { ApiError } from '../services/api/client';

const MESSAGES_BY_STATUS: Record<number, string> = {
  400: 'בדוק/י שהאימייל תקין והסיסמה באורך של לפחות 8 תווים.',
  401: 'אימייל או סיסמה שגויים.',
  409: 'כבר קיים חשבון עם האימייל הזה. נסה/י להתחבר.',
};

const FALLBACK_MESSAGE = 'משהו השתבש. נסה/י שוב.';

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES_BY_STATUS[error.status] ?? FALLBACK_MESSAGE;
  }
  return FALLBACK_MESSAGE;
}
