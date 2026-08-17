import { isNil } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

const SCRIPT_ID = 'cf-turnstile';
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Loaded once per document and shared: mounting the widget twice (the card
// remounts on every step change) must not fetch or evaluate the script again.
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('turnstile script failed to load'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function useTurnstileSiteKey(): string | null {
  const { data: siteKey } = flagsHooks.useFlag<string>(
    ApFlagId.TURNSTILE_SITE_KEY,
  );
  return siteKey ?? null;
}

export function TurnstileWidget({
  onToken,
  onUnavailable,
  resetSignal,
}: TurnstileWidgetProps) {
  const siteKey = useTurnstileSiteKey();
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() =>
      setShown(element.offsetHeight > 0),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!siteKey || !container.current) {
      return;
    }
    let widgetId: string | undefined;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !container.current) {
          return;
        }
        if (!window.turnstile) {
          setFailed(true);
          onUnavailable();
          return;
        }
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          theme: 'light',
          callback: (token: string) => {
            setFailed(false);
            onToken(token);
          },
          'expired-callback': () => onToken(undefined),
          'error-callback': () => {
            setFailed(true);
            onToken(undefined);
          },
        });
        widget.current = widgetId;
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          onUnavailable();
        }
      });

    return () => {
      cancelled = true;
      widget.current = undefined;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey, onToken, onUnavailable]);

  // A Turnstile token is single-use: once the server has rejected the request
  // the widget has to issue a fresh one or every retry replays a spent token.
  useEffect(() => {
    if (resetSignal === 0 || isNil(widget.current) || !window.turnstile) {
      return;
    }
    window.turnstile.reset(widget.current);
    onToken(undefined);
  }, [resetSignal, onToken]);

  if (!siteKey) {
    return null;
  }
  // Say so rather than leaving a dead submit button: the server requires a
  // solved challenge whenever one is configured, so a blocked script means
  // sign-in cannot proceed and the person needs to know why.
  return (
    <>
      <div className={cn(shown && 'pb-7')}>
        <div ref={container} className="flex justify-center" />
      </div>
      {failed && (
        <p className="mt-3 text-center text-xs text-destructive">
          {t(
            'The verification step could not load. Disable your ad blocker for this page, then reload.',
          )}
        </p>
      )}
    </>
  );
}

type TurnstileWidgetProps = {
  onToken: (token: string | undefined) => void;
  onUnavailable: () => void;
  resetSignal: number;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}
