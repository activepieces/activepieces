import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { useEffect } from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';

export function EmbeddingAnalyticsLoader() {
  const { embedState } = useEmbedding();
  const { isEmbedded, gtmContainerId, clarityProjectId } = embedState;

  useEffect(() => {
    if (!isEmbedded) {
      return;
    }
    loadIfValid({
      id: gtmContainerId,
      pattern: GTM_CONTAINER_ID_PATTERN,
      name: 'gtmContainerId',
      load: loadGoogleTagManager,
    });
    loadIfValid({
      id: clarityProjectId,
      pattern: CLARITY_PROJECT_ID_PATTERN,
      name: 'clarityProjectId',
      load: loadClarity,
    });
  }, [isEmbedded, gtmContainerId, clarityProjectId]);

  return null;
}

function loadIfValid({
  id,
  pattern,
  name,
  load,
}: {
  id: string | undefined;
  pattern: RegExp;
  name: string;
  load: (args: { id: string }) => void;
}) {
  if (isNil(id)) {
    return;
  }
  if (!pattern.test(id)) {
    console.warn(`Activepieces embed: ignoring invalid ${name}`, id);
    return;
  }
  const { error } = tryCatchSync(() => load({ id }));
  if (error) {
    console.warn(`Activepieces embed: failed to load ${name}`, error);
  }
}

function loadGoogleTagManager({ id }: { id: string }) {
  const src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
    id,
  )}`;
  if (isScriptLoaded({ src })) {
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  appendScript({ src });
}

function loadClarity({ id }: { id: string }) {
  const src = `https://www.clarity.ms/tag/${encodeURIComponent(id)}`;
  if (isScriptLoaded({ src })) {
    return;
  }
  window.clarity = window.clarity ?? createClarityQueue();
  appendScript({ src });
}

function createClarityQueue(): ClarityQueue {
  const queue: ClarityQueue = (...args: unknown[]) => {
    queue.q = queue.q ?? [];
    queue.q.push(args);
  };
  return queue;
}

function isScriptLoaded({ src }: { src: string }) {
  return !isNil(document.querySelector(`script[src="${src}"]`));
}

function appendScript({ src }: { src: string }) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

const GTM_CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]{1,16}$/;
const CLARITY_PROJECT_ID_PATTERN = /^[a-z0-9]{1,32}$/i;

type ClarityQueue = {
  (...args: unknown[]): void;
  q?: unknown[][];
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    clarity?: ClarityQueue;
  }
}
