// backend/src/types.ts

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export {}; // Makes file into module