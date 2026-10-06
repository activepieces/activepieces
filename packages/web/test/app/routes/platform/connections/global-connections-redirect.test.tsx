/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const plan = { globalConnectionsEnabled: true };

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/app/components/feature-sample', () => ({
  FeatureSample: ({ title }: { title: string }) => <p>{`locked: ${title}`}</p>,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: { useCurrentPlatform: () => ({ platform: { plan } }) },
}));

const { GlobalConnectionsRedirect } = await import(
  '@/app/routes/platform/connections/global-connections-redirect'
);

describe('GlobalConnectionsRedirect', () => {
  it('keeps the query and hash and filters to global connections', () => {
    plan.globalConnectionsEnabled = true;
    expect(
      landingFor('/platform/connections/global?displayName=Slack#top'),
    ).toBe('/platform/connections?displayName=Slack&scope=PLATFORM#top');
  });

  it('shows the plan teaser instead of redirecting on a plan without global connections', () => {
    plan.globalConnectionsEnabled = false;
    expect(landingFor('/platform/connections/global?displayName=Slack')).toBe(
      undefined,
    );
    expect(
      screen.getByText('locked: Global connections').textContent,
    ).toBeTruthy();
  });
});

function landingFor(url: string): string {
  const landed: string[] = [];
  function Landing() {
    const location = useLocation();
    landed.push(`${location.pathname}${location.search}${location.hash}`);
    return null;
  }
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/platform/connections/global"
          element={<GlobalConnectionsRedirect />}
        />
        <Route path="/platform/connections" element={<Landing />} />
      </Routes>
    </MemoryRouter>,
  );
  return landed[landed.length - 1];
}
