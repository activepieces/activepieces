import { t } from 'i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { BrowserViewData } from './stage-context';

export function BrowserLiveView({
  data,
  onDismiss,
  onContinue,
}: {
  data: BrowserViewData;
  onDismiss: () => void;
  onContinue?: () => void;
}) {
  const url = data.interactiveLiveViewUrl ?? data.liveViewUrl;
  const isLive = data.status === 'live';
  const isHandoff = data.status === 'handoff';
  const isPaused = data.status === 'idle';
  // Both 'live' (agent driving) and 'handoff' (waiting on the human) keep the interactive iframe:
  // on a hand-off it's exactly what the user needs to clear the wall (CAPTCHA / login / submit).
  const showIframe = isLive || isHandoff;
  const label = data.displayName ?? t('Live browser');
  const statusLabel = isLive
    ? t('Live')
    : isHandoff
    ? t('Your turn')
    : isPaused
    ? t('Paused')
    : t('Finished');
  // Ended-state caption is only shown for a plain park ('idle') or a closed session — a hand-off
  // renders the live iframe instead. 'idle' stays neutral: the agent finished, nothing is required.
  const endedCaption =
    data.status === 'closed'
      ? t('The browser session has finished.')
      : t('Browser paused.');

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background">
      <div className="shrink-0 flex items-center gap-2 px-3 h-10 border-b bg-background">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
            isLive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : isHandoff
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
          )}
          {statusLabel}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {label}
        </span>
        {data.interactive && showIframe && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {t('Click inside to take over')}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
        {showIframe ? (
          <div className="flex h-full w-full flex-col">
            <iframe
              src={url}
              title={label}
              sandbox="allow-same-origin allow-scripts"
              allow="clipboard-read; clipboard-write"
              className="min-h-0 w-full flex-1 border-0"
            />
            {isHandoff && (
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t bg-amber-50 px-3 py-2 dark:bg-amber-950/40">
                <span className="min-w-0 text-xs text-amber-900 dark:text-amber-200">
                  {t(
                    'Your turn: finish the step in the browser above (e.g. solve the CAPTCHA and submit), then hand back.',
                  )}
                </span>
                {onContinue && (
                  <Button size="sm" className="shrink-0" onClick={onContinue}>
                    {t("I've done it — continue")}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : data.finalScreenshot ? (
          <div className="flex h-full w-full flex-col">
            <img
              src={data.finalScreenshot}
              alt={t('Final view of the browser session')}
              className="min-h-0 w-full flex-1 object-contain"
            />
            <div className="shrink-0 px-3 py-1.5 text-xs text-muted-foreground">
              {endedCaption}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {endedCaption}
          </div>
        )}
      </div>
    </div>
  );
}
