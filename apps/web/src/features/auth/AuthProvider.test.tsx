import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from './authContext';
import { AuthProvider } from './AuthProvider';

// --- Fake Supabase client ---------------------------------------------------
type Listener = (event: string, session: unknown) => void;
const fake = vi.hoisted(() => {
  const state: { listeners: Listener[]; initialSession: unknown; unsubscribed: number } = {
    listeners: [],
    initialSession: null,
    unsubscribed: 0,
  };
  return state;
});

vi.mock('@/lib/env', () => ({
  env: {
    appEnv: 'development',
    siteUrl: undefined,
    supabase: {
      status: 'configured',
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_test',
    },
  },
}));

vi.mock('@/lib/supabase', () => ({
  getSupabase: () =>
    Promise.resolve({
      auth: {
        onAuthStateChange: (cb: Listener) => {
          fake.listeners.push(cb);
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  fake.unsubscribed += 1;
                  fake.listeners = fake.listeners.filter((l) => l !== cb);
                },
              },
            },
          };
        },
        getSession: () => Promise.resolve({ data: { session: fake.initialSession } }),
      },
    }),
}));

const session = (id: string) => ({ user: { id, email: `${id}@example.test` } });
const emit = (event: string, s: unknown) => {
  act(() => {
    for (const l of fake.listeners) l(event, s);
  });
};

function Probe() {
  const { state, isPasswordRecovery } = useAuth();
  return (
    <p data-testid="probe">
      {state.status}
      {state.status === 'signed_in' ? `:${state.user.id}` : ''}
      {isPasswordRecovery ? ':recovery' : ''}
    </p>
  );
}

function setup() {
  const queryClient = new QueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { queryClient, ...utils };
}

beforeEach(() => {
  fake.listeners = [];
  fake.initialSession = null;
  fake.unsubscribed = 0;
});

describe('AuthProvider lifecycle', () => {
  it('starts loading, then resolves the stored session', async () => {
    fake.initialSession = session('alice');
    setup();
    expect(screen.getByTestId('probe')).toHaveTextContent('loading');
    expect(await screen.findByText('signed_in:alice')).toBeInTheDocument();
  });

  it('resolves to signed_out with no stored session', async () => {
    setup();
    expect(await screen.findByText('signed_out')).toBeInTheDocument();
  });

  it('purges user-scoped cache on sign-out but keeps shared cache', async () => {
    fake.initialSession = session('alice');
    const { queryClient } = setup();
    await screen.findByText('signed_in:alice');
    queryClient.setQueryData(['user', 'alice', 'profile'], { username: 'alice' });
    queryClient.setQueryData(['system', 'health'], { ok: true });

    emit('SIGNED_OUT', null);

    expect(screen.getByTestId('probe')).toHaveTextContent('signed_out');
    expect(queryClient.getQueryData(['user', 'alice', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(['system', 'health'])).toEqual({ ok: true });
  });

  it('purges the previous user cache when another account signs in (no SIGNED_OUT)', async () => {
    fake.initialSession = session('alice');
    const { queryClient } = setup();
    await screen.findByText('signed_in:alice');
    queryClient.setQueryData(['user', 'alice', 'profile'], { username: 'alice' });

    emit('SIGNED_IN', session('bob'));

    expect(screen.getByTestId('probe')).toHaveTextContent('signed_in:bob');
    expect(queryClient.getQueryData(['user', 'alice', 'profile'])).toBeUndefined();
  });

  it('keeps cache on token refresh for the same user', async () => {
    fake.initialSession = session('alice');
    const { queryClient } = setup();
    await screen.findByText('signed_in:alice');
    queryClient.setQueryData(['user', 'alice', 'profile'], { username: 'alice' });

    emit('TOKEN_REFRESHED', session('alice'));

    expect(queryClient.getQueryData(['user', 'alice', 'profile'])).toEqual({ username: 'alice' });
  });

  it('tracks password recovery and clears it after the password is updated', async () => {
    setup();
    await screen.findByText('signed_out');
    emit('PASSWORD_RECOVERY', session('alice'));
    expect(screen.getByTestId('probe')).toHaveTextContent('signed_in:alice:recovery');
    emit('USER_UPDATED', session('alice'));
    expect(screen.getByTestId('probe')).toHaveTextContent('signed_in:alice');
    expect(screen.getByTestId('probe')).not.toHaveTextContent('recovery');
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = setup();
    await screen.findByText('signed_out');
    unmount();
    expect(fake.unsubscribed).toBe(1);
    expect(fake.listeners).toHaveLength(0);
  });
});
