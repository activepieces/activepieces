import { t } from 'i18next';
import { Check, Plug, RotateCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { InteractiveCardShell } from './interactive-card-shell';

export function McpReconnectCard({
  reconnect,
  onResolve,
  onDismiss,
  isInteractive = true,
}: {
  reconnect: McpReconnectData;
  onResolve?: (payload: Record<string, unknown>) => void;
  onDismiss?: () => void;
  isInteractive?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [continued, setContinued] = useState(false);

  const canOpen = reconnect.connectUrl.startsWith('https://');

  if (!isInteractive) {
    return (
      <div className="my-2 flex items-center gap-3 rounded-xl border bg-background p-3">
        <ConnectorIcon logoUrl={reconnect.logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{reconnect.displayName}</div>
          <div className="text-xs text-muted-foreground">{t('Connected')}</div>
        </div>
      </div>
    );
  }

  return (
    <InteractiveCardShell
      onDismiss={() => onDismiss?.()}
      title={t('Reconnect {name}', { name: reconnect.displayName })}
    >
      <motion.div
        className="flex items-center gap-3 rounded-xl border bg-background p-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <ConnectorIcon logoUrl={reconnect.logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{reconnect.displayName}</div>
          <div className="text-xs text-muted-foreground">
            {t('Your {name} connection needs to be reconnected', {
              name: reconnect.displayName,
            })}
          </div>
        </div>
        {continued ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="flex shrink-0 items-center justify-center"
          >
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </motion.span>
        ) : !opened ? (
          <Button
            size="sm"
            variant="default"
            className={cn('shrink-0 gap-1.5')}
            disabled={!canOpen}
            onClick={() => {
              openReconnectPopup(reconnect.connectUrl);
              setOpened(true);
            }}
          >
            <Plug className="h-3.5 w-3.5" />
            {t('Reconnect')}
          </Button>
        ) : (
          onResolve && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={() => {
                setContinued(true);
                onResolve({
                  reconnected: true,
                  message: `The user reconnected ${reconnect.displayName}. Retry the action that failed.`,
                });
              }}
            >
              <RotateCw className="h-3 w-3" />
              {t("I've reconnected")}
            </Button>
          )
        )}
      </motion.div>
    </InteractiveCardShell>
  );
}

function openReconnectPopup(url: string) {
  const width = 520;
  const height = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  const popup = window.open(
    url,
    'ap-mcp-reconnect',
    `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`,
  );
  if (!popup) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function ConnectorIcon({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border bg-background object-contain p-1.5"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
      <Plug className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export type McpReconnectData = {
  connectorUuid: string;
  displayName: string;
  connectUrl: string;
  logoUrl?: string;
  reason?: 'expired' | 'unauthorized' | 'revoked';
};
