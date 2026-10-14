/**
 * @vitest-environment jsdom
 */
import { AppConnectionScope } from '@activepieces/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GlobalConnectionsRedirect } from '@/app/routes/platform/connections/global-connections-redirect';

const state = vi.hoisted((): { globalConnectionsEnabled: boolean } => ({
  globalConnectionsEnabled: true,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        plan: { globalConnectionsEnabled: state.globalConnectionsEnabled },
      },
    }),
  },
}));

const LocationProbe = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{`${pathname}${search}`}</div>;
};

function redirectParamsFor(url: string): URLSearchParams {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/platform/connections/global"
          element={<GlobalConnectionsRedirect />}
        />
        <Route path="/platform/connections" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
  const location = screen.getByTestId('location').textContent ?? '';
  const [pathname, query = ''] = location.split('?');
  expect(pathname).toBe('/platform/connections');
  return new URLSearchParams(query);
}

describe('GlobalConnectionsRedirect', () => {
  beforeEach(() => {
    state.globalConnectionsEnabled = true;
  });

  it('keeps saved filters and page size, adds the global scope and drops the cursor', () => {
    const params = redirectParamsFor(
      '/platform/connections/global?displayName=notion&limit=50&cursor=abc',
    );
    expect(params.get('displayName')).toBe('notion');
    expect(params.get('limit')).toBe('50');
    expect(params.get('scope')).toBe(AppConnectionScope.PLATFORM);
    expect(params.has('cursor')).toBe(false);
  });

  it('keeps repeated filter values', () => {
    const params = redirectParamsFor(
      '/platform/connections/global?status=ACTIVE&status=ERROR&pieceName=slack',
    );
    expect(params.getAll('status')).toEqual(['ACTIVE', 'ERROR']);
    expect(params.get('pieceName')).toBe('slack');
  });

  it('does not add the scope filter when global connections are disabled', () => {
    state.globalConnectionsEnabled = false;
    const params = redirectParamsFor(
      '/platform/connections/global?displayName=notion&cursor=abc',
    );
    expect(params.get('displayName')).toBe('notion');
    expect(params.has('scope')).toBe(false);
    expect(params.has('cursor')).toBe(false);
  });
});
