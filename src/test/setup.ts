import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// supabaseClient.ts throws at import time without these. Fake values only:
// every test mocks the client, so nothing ever reaches a real database.
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

afterEach(() => {
  cleanup();
});
