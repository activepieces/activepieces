// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { RedirectKeepingHash } from '@/app/routes/redirect-keeping-hash';

afterEach(cleanup);

describe('RedirectKeepingHash', () => {
  it('keeps the chat sheet hash and state through the redirect', () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/flows', hash: '#chat', state: { chatSheet: true } },
        ]}
      >
        <Routes>
          <Route
            path="/flows"
            element={<RedirectKeepingHash to="/automations" />}
          />
          <Route path="/automations" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('location').textContent).toBe(
      '/automations#chat {"chatSheet":true}',
    );
  });
});

function LocationProbe() {
  const { pathname, hash, state } = useLocation();
  return (
    <output data-testid="location">{`${pathname}${hash} ${JSON.stringify(
      state,
    )}`}</output>
  );
}
