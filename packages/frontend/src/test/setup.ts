import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock-Handler für API-Endpunkte
export const handlers = [
  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({ id: 1, username: 'testuser' });
  }),
];

// MSW-Server für Tests
export const server = setupServer(...handlers);

// Server vor allen Tests starten
beforeAll(() => server.listen());

// Nach jedem Test zurücksetzen
afterEach(() => server.resetHandlers());

// Nach allen Tests schließen
afterAll(() => server.close());