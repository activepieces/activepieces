/**
 * @vitest-environment jsdom
 *
 * GIT-1746: embed vendors can ask the embedded app to load Google Tag Manager
 * and Microsoft Clarity inside the iframe, since scripts on the parent page
 * cannot see into it. Only validated ids are accepted, each provider loads at
 * most once (StrictMode double-invokes effects), and nothing loads outside
 * embed mode.
 *
 * The Clarity tag served at clarity.ms/tag/<id> is not self-contained: it
 * calls window.clarity(...) synchronously and expects the official snippet's
 * queue stub to already exist, so the loader must install that stub first.
 *
 * Uses raw `react-dom` + React's `act` because @testing-library/react is not a
 * dependency of this package.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmbeddingAnalyticsLoader } from '@/app/components/embedding-analytics-loader';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  embedState: {
    isEmbedded: true,
    gtmContainerId: undefined as string | undefined,
    clarityProjectId: undefined as string | undefined,
  },
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({
    embedState: mocks.embedState,
    setEmbedState: () => undefined,
  }),
}));

describe('EmbeddingAnalyticsLoader', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    document.head.innerHTML = '';
    window.dataLayer = undefined;
    window.clarity = undefined;
    mocks.embedState.isEmbedded = true;
    mocks.embedState.gtmContainerId = undefined;
    mocks.embedState.clarityProjectId = undefined;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('loads GTM and Clarity once each from valid ids, even under StrictMode', () => {
    mocks.embedState.gtmContainerId = 'GTM-ABC123';
    mocks.embedState.clarityProjectId = 'abc123xyz';

    render({ root });

    expect(scriptSources()).toEqual([
      'https://www.googletagmanager.com/gtm.js?id=GTM-ABC123',
      'https://www.clarity.ms/tag/abc123xyz',
    ]);
    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer?.[0]).toMatchObject({ event: 'gtm.js' });
  });

  it('installs the Clarity queue stub the tag script calls into before it loads', () => {
    mocks.embedState.clarityProjectId = 'abc123xyz';

    render({ root });

    expect(typeof window.clarity).toBe('function');
    window.clarity?.('start', { projectId: 'abc123xyz' });
    window.clarity?.('set', 'C_IS', '0');
    expect(window.clarity?.q).toEqual([
      ['start', { projectId: 'abc123xyz' }],
      ['set', 'C_IS', '0'],
    ]);
  });

  it('ignores ids that do not match the provider format', () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    mocks.embedState.gtmContainerId = 'GTM-<script>';
    mocks.embedState.clarityProjectId = '../evil';

    render({ root });

    expect(scriptSources()).toEqual([]);
    expect(window.dataLayer).toBeUndefined();
    expect(window.clarity).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('gtmContainerId'),
      'GTM-<script>',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('clarityProjectId'),
      '../evil',
    );
    warnSpy.mockRestore();
  });

  it('loads nothing outside embed mode', () => {
    mocks.embedState.isEmbedded = false;
    mocks.embedState.gtmContainerId = 'GTM-ABC123';
    mocks.embedState.clarityProjectId = 'abc123xyz';

    render({ root });

    expect(scriptSources()).toEqual([]);
    expect(window.clarity).toBeUndefined();
  });
});

function render({ root }: { root: Root }) {
  act(() => {
    root.render(
      <React.StrictMode>
        <EmbeddingAnalyticsLoader />
      </React.StrictMode>,
    );
  });
}

function scriptSources() {
  return Array.from(document.head.querySelectorAll('script')).map(
    (script) => script.src,
  );
}
