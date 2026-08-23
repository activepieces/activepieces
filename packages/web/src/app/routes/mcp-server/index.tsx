import { t } from 'i18next';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { PageHeader } from '@/components/custom/page-header';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { ConnectCards } from './connect-cards';
import { ConnectedClients } from './connected-clients';
import { useMcpServerUrl } from './mcp-client-identity';

export default function McpServerPage() {
  const { serverUrl, isPublic } = useMcpServerUrl();

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader showSidebarToggle={true} title={t('MCP Server')} />
      <div
        className={cn('flex flex-col gap-8 pb-10', DASHBOARD_CONTENT_PADDING_X)}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('Server URL')}</label>
          <p className="text-xs text-muted-foreground">
            {t('No API keys — the URL is the whole credential.')}
          </p>
          <CopyToClipboardInput textToCopy={serverUrl} useInput={true} />
        </div>

        <ConnectCards serverUrl={serverUrl} isPublicUrl={isPublic} />

        <ConnectedClients />
      </div>
    </div>
  );
}
