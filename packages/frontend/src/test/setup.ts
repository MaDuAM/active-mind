import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock-Handler for API-Endpoints
export const handlers = [
  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({ id: 1, username: 'testuser' });
  }),
];

// MSW-Server for Tests
export const server = setupServer(...handlers);

// Server start before all tests
beforeAll(() => server.listen());

// Reset after each test
afterEach(() => server.resetHandlers());

// After all tests, we conclude
afterAll(() => server.close());