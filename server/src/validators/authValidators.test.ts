import { describe, expect, it } from 'vitest';
import { credentialsSchema } from './authValidators.js';

describe('credentialsSchema', () => {
  it('accepts a valid email and password', () => {
    const result = credentialsSchema.safeParse({ email: 'user@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('normalizes email casing and whitespace', () => {
    const result = credentialsSchema.safeParse({ email: '  User@Example.com  ', password: 'password123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects an invalid email', () => {
    const result = credentialsSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = credentialsSchema.safeParse({ email: 'user@example.com', password: 'short1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password longer than 72 characters', () => {
    const result = credentialsSchema.safeParse({ email: 'user@example.com', password: 'a'.repeat(73) });
    expect(result.success).toBe(false);
  });

  it('rejects a missing password', () => {
    const result = credentialsSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });
});
