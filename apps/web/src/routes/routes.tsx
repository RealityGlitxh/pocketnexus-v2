import type { RouteObject } from 'react-router';
import { RouteErrorBoundary } from '@/components/ErrorBoundaries';
import { RouteFallback } from '@/components/RouteFallback';
import { AppShell } from '@/layouts/AppShell';
import { AuthLayout } from '@/layouts/AuthLayout';

/**
 * Route table. Every page is lazy-loaded so each module ships as its own
 * chunk and unrelated modules never load each other's code.
 *
 * This file is the one place allowed to deep-import feature pages, and only
 * via dynamic import() (see docs/ARCHITECTURE.md → Module boundaries).
 */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/dashboard')).DashboardPage }),
          },
          {
            path: 'cards',
            lazy: async () => ({ Component: (await import('@/features/cards')).CardsPage }),
          },
          {
            path: 'decks',
            lazy: async () => ({ Component: (await import('@/features/decks')).DecksPage }),
          },
          {
            path: 'battles',
            lazy: async () => ({ Component: (await import('@/features/battles')).BattlesPage }),
          },
          {
            path: 'meta',
            lazy: async () => ({ Component: (await import('@/features/meta')).MetaPage }),
          },
          {
            path: 'profile',
            lazy: async () => ({ Component: (await import('@/features/profile')).ProfilePage }),
          },
          {
            path: 'settings',
            lazy: async () => ({ Component: (await import('@/features/settings')).SettingsPage }),
          },
          {
            path: '*',
            lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }),
          },
        ],
      },
    ],
  },
  {
    path: 'auth',
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'sign-in',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/SignInPage')).SignInPage,
        }),
      },
      {
        path: 'sign-up',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/SignUpPage')).SignUpPage,
        }),
      },
      {
        path: 'forgot-password',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/ForgotPasswordPage')).ForgotPasswordPage,
        }),
      },
      {
        path: 'update-password',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/UpdatePasswordPage')).UpdatePasswordPage,
        }),
      },
    ],
  },
];
