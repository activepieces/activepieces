/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document */
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', async () => (await import('./admin-test-kit')).i18nextMock);

import { SaveBar } from '@/app/components/admin/save-bar';

function mountWithRouter(element: React.ReactNode) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            {element}
            <Link to="/other">{'Go elsewhere'}</Link>
          </>
        ),
      },
      { path: '/other', element: <p>{'Other page'}</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

function ControlledSaveBar({ control }: { control: BarControl }) {
  const [state, setState] = React.useState<BarState>({
    dirty: true,
    saving: true,
  });
  control.set = setState;
  return <SaveBar {...state} onSave={() => undefined} />;
}

class RouterRequest {
  url: string;
  signal: AbortSignal | undefined;
  constructor(url: string, init?: { signal?: AbortSignal }) {
    this.url = url;
    this.signal = init?.signal;
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('SaveBar leave guard', () => {
  it('waits for an in-flight save, then continues the navigation', async () => {
    vi.stubGlobal('Request', RouterRequest);
    const control: BarControl = {};
    const router = mountWithRouter(<ControlledSaveBar control={control} />);
    fireEvent.click(screen.getByText('Go elsewhere'));
    await act(async () => undefined);
    expect(screen.queryByText('Leave without saving?')).toBeNull();
    await act(async () => control.set?.({ dirty: false, saving: false }));
    expect(await screen.findByText('Other page')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/other');
  });
});

type BarState = { dirty: boolean; saving: boolean; error?: string };
type BarControl = { set?: (state: BarState) => void };
