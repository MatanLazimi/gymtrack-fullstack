import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('unknown route', () => {
  it('returns 404', async () => {
    const app = createApp();
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
  });
});
