import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Providers } from '@/app/Providers';
import { AppErrorBoundary } from '@/components/ErrorBoundaries';
import { routes } from '@/routes/routes';

const router = createBrowserRouter(routes);

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root is missing from index.html');

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </AppErrorBoundary>
  </StrictMode>,
);
