// @vitest-environment jsdom
import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const useIsPlatformAdmin = vi.fn();
const useSecurityAdvisories = vi.fn();
const useSecurityAdvisoryStore = vi.fn();
const useNavigate = vi.fn(() => vi.fn());

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => useIsPlatformAdmin(),
}));

vi.mock('@/features/platform-admin', () => ({
  healthQueries: {
    useSecurityAdvisories: () => useSecurityAdvisories(),
  },
  useSecurityAdvisoryStore: (selector: (state: unknown) => unknown) =>
    useSecurityAdvisoryStore(selector),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => useNavigate(),
}));

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

import { SecurityAdvisoryBanner } from '@/app/components/security-advisory-banner';

describe('SecurityAdvisoryBanner — non-admin gating', () => {
  it('renders nothing when the user is not a platform admin', () => {
    useIsPlatformAdmin.mockReturnValue(false);

    const html = renderToString(React.createElement(SecurityAdvisoryBanner));

    expect(html).toBe('');
    // The hook providing advisory data must not be called for non-admins —
    // this is the load-bearing privacy guarantee.
    expect(useSecurityAdvisories).not.toHaveBeenCalled();
  });

  it('renders nothing when the user is admin but the advisory query has no data yet', () => {
    useIsPlatformAdmin.mockReturnValue(true);
    useSecurityAdvisories.mockReturnValue({ data: undefined });
    useSecurityAdvisoryStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ dismissedIds: [], markDismissed: vi.fn() }),
    );

    const html = renderToString(React.createElement(SecurityAdvisoryBanner));

    expect(html).toBe('');
  });

  it('renders nothing when the user is admin but no high/critical advisories exist', () => {
    useIsPlatformAdmin.mockReturnValue(true);
    useSecurityAdvisories.mockReturnValue({
      data: {
        currentVersion: '0.71.0',
        fetchedAt: '2026-01-01T00:00:00.000Z',
        partial: false,
        advisories: [
          {
            id: 'github:GHSA-low',
            source: 'github',
            severity: 'low',
            summary: 'low-sev',
            description: '',
            ghsaId: 'GHSA-low',
            cveId: null,
            cvssScore: null,
            vulnerableVersionRange: '>= 0.0.0',
            patchedVersion: null,
            publishedAt: '',
            updatedAt: '',
            htmlUrl: 'https://example.com',
          },
        ],
      },
    });
    useSecurityAdvisoryStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ dismissedIds: [], markDismissed: vi.fn() }),
    );

    const html = renderToString(React.createElement(SecurityAdvisoryBanner));

    expect(html).toBe('');
  });

  it('renders nothing when all high/critical advisories are already dismissed', () => {
    useIsPlatformAdmin.mockReturnValue(true);
    useSecurityAdvisories.mockReturnValue({
      data: {
        currentVersion: '0.71.0',
        fetchedAt: '2026-01-01T00:00:00.000Z',
        partial: false,
        advisories: [
          {
            id: 'github:GHSA-critical-1',
            source: 'github',
            severity: 'critical',
            summary: 'critical',
            description: '',
            ghsaId: 'GHSA-critical-1',
            cveId: null,
            cvssScore: 9.8,
            vulnerableVersionRange: '>= 0.0.0',
            patchedVersion: null,
            publishedAt: '',
            updatedAt: '',
            htmlUrl: 'https://example.com',
          },
        ],
      },
    });
    useSecurityAdvisoryStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          dismissedIds: ['github:GHSA-critical-1'],
          markDismissed: vi.fn(),
        }),
    );

    const html = renderToString(React.createElement(SecurityAdvisoryBanner));

    expect(html).toBe('');
  });

  it('renders the banner when an admin has unseen critical advisories', () => {
    useIsPlatformAdmin.mockReturnValue(true);
    useSecurityAdvisories.mockReturnValue({
      data: {
        currentVersion: '0.71.0',
        fetchedAt: '2026-01-01T00:00:00.000Z',
        partial: false,
        advisories: [
          {
            id: 'github:GHSA-critical-2',
            source: 'github',
            severity: 'critical',
            summary: 'critical',
            description: '',
            ghsaId: 'GHSA-critical-2',
            cveId: null,
            cvssScore: 9.8,
            vulnerableVersionRange: '>= 0.0.0',
            patchedVersion: null,
            publishedAt: '',
            updatedAt: '',
            htmlUrl: 'https://example.com',
          },
        ],
      },
    });
    useSecurityAdvisoryStore.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ dismissedIds: [], markDismissed: vi.fn() }),
    );

    const html = renderToString(React.createElement(SecurityAdvisoryBanner));

    expect(html).not.toBe('');
    expect(html).toContain('Security issue affects this version');
  });
});
