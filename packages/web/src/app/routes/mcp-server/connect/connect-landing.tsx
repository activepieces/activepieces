import { t } from 'i18next';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CapabilitiesSection } from '../capabilities-section';
import { ClientIcon } from '../client-icon';
import { CatalogClient, POPULAR_CLIENT_KEYS } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

export function ConnectLanding({
  clients,
  isReachableFromInternet,
}: {
  clients: CatalogClient[];
  isReachableFromInternet: boolean;
}) {
  const nav = useMcpNav();
  const primaryKeys = [...POPULAR_CLIENT_KEYS, OTHER_CLIENT_KEY];
  const primaryClients = primaryKeys
    .map((key) => clients.find((client) => client.key === key))
    .filter((client): client is CatalogClient => client !== undefined);
  const moreClients = clients.filter(
    (client) => !primaryKeys.includes(client.key),
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageBand className="flex flex-col items-center gap-9 pb-12 pt-10 lg:px-14">
        <div className="flex max-w-[760px] flex-col items-center gap-3.5 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight lg:whitespace-nowrap">
            {t('Use Activepieces in your favorite AI tool')}
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-muted-foreground">
            {t(
              'Build automations, act in your apps, and work with your data from the AI tools your team already uses.',
            )}
          </p>
        </div>

        <div className="flex w-full max-w-[720px] flex-col gap-2">
          <InstallTabs
            primaryClients={primaryClients}
            moreClients={moreClients}
            isReachableFromInternet={isReachableFromInternet}
            onShowSteps={(key) => nav.showClient(key)}
          />
        </div>
      </PageBand>

      <CapabilitiesSection />
    </div>
  );
}

function InstallTabs({
  primaryClients,
  moreClients,
  isReachableFromInternet,
  onShowSteps,
}: {
  primaryClients: CatalogClient[];
  moreClients: CatalogClient[];
  isReachableFromInternet: boolean;
  onShowSteps: (key: string) => void;
}) {
  const [activeKey, setActiveKey] = useState(primaryClients[0]?.key);
  const allClients = [...primaryClients, ...moreClients];
  const active = allClients.find((client) => client.key === activeKey);
  const moreActive = moreClients.some((client) => client.key === activeKey);

  if (!active) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {primaryClients.map((client) => (
          <button
            key={client.key}
            type="button"
            onClick={() => setActiveKey(client.key)}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              client.key === activeKey
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <ClientIcon icon={client.icon} className="size-[18px] shrink-0" />
            <span className="truncate">
              {client.key === OTHER_CLIENT_KEY ? t('Other') : client.name}
            </span>
          </button>
        ))}
        {moreClients.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  moreActive
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {moreActive && (
                  <ClientIcon
                    icon={active.icon}
                    className="size-[18px] shrink-0"
                  />
                )}
                <span className="truncate">
                  {moreActive ? active.name : t('More')}
                </span>
                <ChevronDown className="size-3.5 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {moreClients.map((client) => (
                <DropdownMenuItem
                  key={client.key}
                  onClick={() => setActiveKey(client.key)}
                >
                  <ClientIcon icon={client.icon} className="mr-2 size-4" />
                  {client.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <InstallPanel
        client={active}
        isReachableFromInternet={isReachableFromInternet}
        onShowSteps={() => onShowSteps(active.key)}
      />
    </div>
  );
}

function InstallPanel({
  client,
  isReachableFromInternet,
  onShowSteps,
}: {
  client: CatalogClient;
  isReachableFromInternet: boolean;
  onShowSteps: () => void;
}) {
  const install = client.instructions[0];
  const auth = client.instructions[1];
  const actionBlocked =
    install?.action?.requiresInternetReachableUrl === true &&
    !isReachableFromInternet;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-6">
      {install?.body && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {install.body}
        </p>
      )}
      {install?.action && (
        <div className="flex flex-col gap-1.5">
          <Button asChild={!actionBlocked} disabled={actionBlocked}>
            {actionBlocked ? (
              <span>{install.action.label}</span>
            ) : (
              <a
                href={install.action.href}
                target={
                  install.action.href.startsWith('http') ? '_blank' : undefined
                }
                rel="noreferrer"
              >
                {install.action.label}
              </a>
            )}
          </Button>
          {actionBlocked && (
            <span className="text-sm text-muted-foreground">
              {t('Needs a public HTTPS URL, so localhost will not reach it.')}
            </span>
          )}
        </div>
      )}
      {install?.command &&
        (install.action ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {t('Or run it in your terminal')}
            </span>
            <CommandBlock command={install.command} />
          </div>
        ) : (
          <CommandBlock command={install.command} />
        ))}
      {auth?.body && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {auth.body}
        </p>
      )}
      <div className="flex items-center gap-5 border-t pt-3.5 text-sm">
        <button
          type="button"
          onClick={onShowSteps}
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          {t('Step-by-step')}
        </button>
        {client.directoryUrl &&
          install?.action?.href !== client.directoryUrl && (
            <a
              href={client.directoryUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('Directory listing')}
              <ExternalLink className="size-3.5" />
            </a>
          )}
        <a
          href={client.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('Full guide')}
          <ExternalLink className="size-3.5" />
        </a>
        {client.config && !install?.action && (
          <CopyButton
            textToCopy={client.config.snippet}
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-sm font-normal text-muted-foreground"
          >
            {t('Copy JSON')}
          </CopyButton>
        )}
      </div>
    </div>
  );
}

function CommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/60 py-2.5 pl-4 pr-2">
      <code className="scrollbar-none min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
        {command}
      </code>
      <CopyButton
        textToCopy={command}
        variant="ghost"
        className="size-8 shrink-0"
      />
    </div>
  );
}

const OTHER_CLIENT_KEY = 'unknown';
