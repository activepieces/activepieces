/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { GetSystemHealthChecksResponse } from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

const versions = vi.hoisted(() => ({
  running: '0.88.1',
  staleFlag: '0.88.0',
}));

const systemHealthMock = vi.hoisted(() => ({
  data: undefined as GetSystemHealthChecksResponse | undefined,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', () => ({
  Boxes: () => null,
  Cpu: () => null,
  ExternalLink: () => null,
  GitCompareArrows: () => null,
  HardDrive: () => null,
  Info: () => null,
  MemoryStick: () => null,
  Package: () => null,
  Server: () => null,
}));

vi.mock(
  '@/app/routes/platform/infra/health/components/daily-health-strip',
  () => ({ DailyHealthStrip: () => null }),
);

vi.mock('@/features/platform-admin', () => ({
  healthQueries: {
    useSystemHealth: () => ({ data: systemHealthMock.data, isPending: false }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: versions.staleFlag }),
  },
}));

// eslint-disable-next-line import/first
import { SystemHealthTab } from '@/app/routes/platform/infra/health/components/system-health-tab';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('SystemHealthTab version row', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  const readTabText = (current: string) => {
    systemHealthMock.data = buildHealth(current);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(<SystemHealthTab onSeeRuns={() => {}} />);
    });
    return container.textContent ?? '';
  };

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    container = null;
    root = null;
  });

  it('renders the release from the health payload, never the cached flag', () => {
    const text = readTabText(versions.running);

    expect(text).toContain(`Current ${versions.running}`);
    expect(text).not.toContain(`Current ${versions.staleFlag}`);
  });

  it('passes when the payload release matches the latest release', () => {
    const text = readTabText(versions.running);

    expect(text).not.toContain('Needs attention');
  });

  it('needs attention when the payload release is behind the latest release', () => {
    const text = readTabText(versions.staleFlag);

    expect(text).toContain(`Current ${versions.staleFlag}`);
    expect(text).toContain('Needs attention');
  });
});

function buildHealth(current: string): GetSystemHealthChecksResponse {
  return {
    latestVersion: versions.running,
    appCpu: true,
    appRam: true,
    disk: true,
    workerCpu: true,
    workerRam: true,
    database: true,
    release: {
      current,
      workers: { total: 1, versionMismatched: 0, mismatchedVersions: [] },
    },
  };
}
