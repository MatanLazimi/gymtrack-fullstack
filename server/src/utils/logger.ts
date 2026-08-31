type LogLevel = 'info' | 'warn' | 'error';

const REDACTED_KEYS = ['password', 'passwordHash', 'token', 'secret'];

function redact(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return meta;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    clean[key] = REDACTED_KEYS.includes(key) ? '[REDACTED]' : value;
  }
  return clean;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = { level, time: new Date().toISOString(), message, ...redact(meta) };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
