import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, ArrowRight, Blocks, Plus, ShieldCheck } from 'lucide-react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { mcpClientDisplay } from '../mcp-client-display';
import { useMcpNav } from '../mcp-nav';

import { ConnectHome } from './use-connect-home';

export function ConnectedCard({
  home,
  serverUrl,
  onAddClient,
  className,
}: {
  home: ConnectHome;
  serverUrl: string;
  onAddClient: () => void;
  className?: string;
}) {
  const nav = useMcpNav();
  const shown = home.grants.slice(0, MAX_SHOWN);
  const links = [
    { icon: ShieldCheck, title: t('Manage access'), tab: 'connections' },
    { icon: Blocks, title: t('Choose tools'), tab: 'tools' },
    { icon: Activity, title: t('See activity'), tab: 'activity' },
  ];

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-6 rounded-xl border bg-panel p-6',
        className,
      )}
    >
      <span className="text-base font-semibold">{t('Your clients')}</span>

      <ul className="flex flex-col gap-4">
        {shown.map((grant) => (
          <GrantRow key={grant.id} grant={grant} />
        ))}
      </ul>

      <ul className="flex flex-col border-t pt-4">
        {links.map((link) => (
          <li key={link.tab}>
            <button
              type="button"
              onClick={() => nav.showTab(link.tab)}
              className="flex h-9 w-full items-center gap-3 rounded-lg px-2 text-left text-sm transition-colors hover:bg-gray-3"
            >
              <link.icon className="size-4 text-gray-11" />
              <span className="flex-1">{link.title}</span>
              <ArrowRight className="size-4 text-gray-9" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        <span className="text-xs text-gray-11">
          {t('Server URL, for adding a client by hand')}
        </span>
        <CopyToClipboardInput textToCopy={serverUrl} useInput />
      </div>

      <Button variant="outline" className="w-full" onClick={onAddClient}>
        <Plus />
        {t('Connect another client')}
      </Button>
    </section>
  );
}

function GrantRow({ grant }: { grant: McpOAuthGrant }) {
  return (
    <li className="flex items-center gap-3">
      <ClientIcon
        icon={mcpClientDisplay.icon(grant.clientKey)}
        className="size-8 rounded-lg"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {mcpClientDisplay.label({
            key: grant.clientKey,
            clientName: grant.clientName,
          })}
        </span>
        <span className="truncate text-xs text-gray-11">
          {grant.projectName ?? t('All projects')}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-2 text-xs text-gray-11">
        <span
          className={cn(
            'size-1.5 rounded-full',
            grant.lastUsedAt ? 'bg-success-10' : 'bg-gray-9',
          )}
        />
        {grant.lastUsedAt
          ? t('Used {ago}', {
              ago: formatUtils.formatDateToAgo(new Date(grant.lastUsedAt)),
            })
          : t('Waiting for first call')}
      </span>
    </li>
  );
}

const MAX_SHOWN = 3;
