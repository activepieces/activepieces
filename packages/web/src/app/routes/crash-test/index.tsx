import { useState } from 'react';

import { Button } from '@/components/ui/button';

export const CrashTestPage = () => {
  const [renderCrash, setRenderCrash] = useState(false);
  const [chunkCrash, setChunkCrash] = useState(false);

  if (renderCrash) {
    throw new Error('CrashTest: render error');
  }
  if (chunkCrash) {
    throw new Error(
      'Failed to fetch dynamically imported module: /assets/fake-chunk.js',
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Crash Test (dev only)
        </h1>
        <p className="text-sm text-muted-foreground">
          Each button exercises a different error path. Watch the console for{' '}
          <code>[frontend-error]</code> logs and the Network tab for PostHog
          requests.
        </p>

        <div className="flex flex-col gap-3">
          <Button variant="destructive" onClick={() => setRenderCrash(true)}>
            Render crash → RouteErrorBoundary fallback
          </Button>

          <Button variant="destructive" onClick={() => setChunkCrash(true)}>
            Chunk-error render → &quot;new version available&quot; fallback
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              throw new Error('CrashTest: event handler error');
            }}
          >
            Event-handler error → window &quot;error&quot; report (no crash)
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              Promise.reject(new Error('CrashTest: unhandled rejection'));
            }}
          >
            Unhandled promise rejection → window report (no crash)
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              throw new Error('CrashTest: dedup');
            }}
          >
            Dedup test → click twice in 5s = one report
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: the real stale-chunk auto-reload only happens for failed lazy
          imports — simulate it via DevTools &rarr; Network &rarr; block a{' '}
          <code>*.js</code> request, then navigate to an unvisited route.
        </p>
      </div>
    </div>
  );
};
