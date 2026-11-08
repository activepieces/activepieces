import { t } from 'i18next';
import { Check, Plug } from 'lucide-react';
import { useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';

import {
  ChatCard,
  ChatCardActions,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatLine } from './chat-ui/chat-line';

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
      <ChatLine
        icon={<Check className="size-3.5 text-success-10" />}
        detail={reconnect.displayName}
      >
        {t('Connected')}
      </ChatLine>
    );
  }

  return (
    <ChatCard turn>
      <ChatCardHeader
        tile={<ConnectorTile logoUrl={reconnect.logoUrl} />}
        title={t('Reconnect {name}', { name: reconnect.displayName })}
      />
      <ChatCardBody>
        <p className="text-sm text-gray-11">
          {t('Your {name} connection needs to be reconnected', {
            name: reconnect.displayName,
          })}
        </p>
      </ChatCardBody>
      <ChatCardActions>
        {!opened ? (
          <Button
            size="sm"
            type="button"
            disabled={!canOpen}
            onClick={() => {
              openReconnectPopup(reconnect.connectUrl);
              setOpened(true);
            }}
          >
            {t('Reconnect')}
          </Button>
        ) : (
          onResolve && (
            <Button
              size="sm"
              type="button"
              disabled={continued}
              onClick={() => {
                if (continued) return;
                setContinued(true);
                onResolve({
                  reconnected: true,
                  message: `The user reconnected ${reconnect.displayName}. Retry the action that failed.`,
                });
              }}
            >
              {t("I've reconnected")}
            </Button>
          )
        )}
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={continued}
            onClick={onDismiss}
          >
            {t('Not now')}
          </Button>
        )}
      </ChatCardActions>
    </ChatCard>
  );
}

function openReconnectPopup(url: string) {
  const width = 520;
  const height = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  window.open(
    url,
    'ap-mcp-reconnect',
    `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`,
  );
}

function ConnectorTile({ logoUrl }: { logoUrl?: string }) {
  if (!logoUrl) {
    return <ChatCardTile kind="file" icon={Plug} />;
  }
  return (
    <LogoPlate
      src={logoUrl}
      alt=""
      className="size-8 rounded-lg border border-gray-5"
      innerClassName="p-1.5"
    />
  );
}

export type McpReconnectData = {
  connectorUuid: string;
  displayName: string;
  connectUrl: string;
  logoUrl?: string;
  reason?: 'expired' | 'unauthorized' | 'revoked';
};
