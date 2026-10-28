import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '@/app/Providers';
import { createQueryClient } from '@/app/queryClient';
import { routes } from '@/routes/routes';

/** Renders the real route table at `path` with all app providers. */
export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createQueryClient();
  const utils = render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...utils, router };
}
