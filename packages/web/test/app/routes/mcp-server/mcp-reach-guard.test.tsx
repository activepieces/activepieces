/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const reach = vi.hoisted(() => vi.fn());
const refusedCode = vi.hoisted(() => ({ value: null as string | null }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: { error: () => undefined } }));
vi.mock('@/lib/api', () => ({
  api: {
    isApError: (_error: unknown, code: string) => refusedCode.value === code,
  },
}));
vi.mock('@/app/components/project-settings/mcp-server/utils/mcp-api', () => ({
  mcpApi: { reach },
}));

const { McpReachGuard } = await import(
  '@/app/routes/mcp-server/mcp-reach-guard'
);

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function renderGuard() {
  const queryClient = new QueryClient();
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/mcp-server']}>
          <Routes>
            <Route
              path="/mcp-server"
              element={<McpReachGuard>mcp page</McpReachGuard>}
            />
            <Route path="/404" element={<>not found</>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  reach.mockReset();
  refusedCode.value = null;
});

describe('McpReachGuard', () => {
  it('opens the page when reach fails, so a broken endpoint never locks anyone out', async () => {
    reach.mockRejectedValue(new Error('boom'));
    await renderGuard();
    expect(container.textContent).toBe('mcp page');
  });

  it('sends a user the server refuses, such as an embedded user, to 404', async () => {
    refusedCode.value = 'AUTHORIZATION';
    reach.mockRejectedValue(new Error('forbidden'));
    await renderGuard();
    expect(container.textContent).toBe('not found');
  });

  it('sends a user who reaches no project to 404', async () => {
    reach.mockResolvedValue({ projectIds: [] });
    await renderGuard();
    expect(container.textContent).toBe('not found');
  });

  it('opens the page when the user reaches a project', async () => {
    reach.mockResolvedValue({ projectIds: ['project-1'] });
    await renderGuard();
    expect(container.textContent).toBe('mcp page');
  });
});
