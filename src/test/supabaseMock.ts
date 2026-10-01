import { vi } from 'vitest';

type Result = { data: unknown; error: { message: string } | null };

// A chainable stand-in for the Supabase query builder. Every chain method
// returns the same builder; awaiting it (or calling single/maybeSingle)
// resolves to the queued result. `calls` records the chain for assertions.
export function createQueryBuilder(result: Result = { data: null, error: null }) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    });
  }
  for (const method of ['single', 'maybeSingle']) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push([method, args]);
      return Promise.resolve(result);
    });
  }
  builder.then = (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return { builder, calls };
}

export function createSupabaseMock() {
  const queue: Result[] = [];
  const builders: ReturnType<typeof createQueryBuilder>[] = [];
  const from = vi.fn((table: string) => {
    const made = createQueryBuilder(queue.shift() ?? { data: null, error: null });
    made.calls.push(['from', [table]]);
    builders.push(made);
    return made.builder;
  });
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  return {
    supabase: { from, auth },
    /** Queue the result for the next `from()` call. */
    respondWith: (data: unknown, error: Result['error'] = null) => queue.push({ data, error }),
    /** Recorded chain of the most recent `from()` call. */
    lastCalls: () => builders[builders.length - 1]?.calls ?? [],
    reset: () => {
      queue.length = 0;
      builders.length = 0;
      from.mockClear();
    },
  };
}
