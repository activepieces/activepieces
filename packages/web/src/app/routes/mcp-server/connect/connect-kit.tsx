import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { CatalogClient } from '../mcp-client-catalog';
import { mcpClientDisplay } from '../mcp-client-display';
import { useMcpNav } from '../mcp-nav';

import { ConnectHome } from './use-connect-home';

export function ConnectAction({
  home,
  serverUrl,
  isReachableFromInternet,
}: {
  home: ConnectHome;
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const client = home.selected;
  const [install, authenticate] = client.instructions;
  const action = install.action;
  const isBlocked =
    action?.requiresInternetReachableUrl === true && !isReachableFromInternet;
  const copyValue = install.command ?? serverUrl;
  const isCommand = copyValue !== serverUrl;

  return (
    <div
      key={client.key}
      className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
    >
      {action && (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            disabled={isBlocked}
            asChild={!isBlocked}
            onClick={home.startWatching}
          >
            {isBlocked ? (
              <span>{action.label}</span>
            ) : (
              <a href={action.href} target="_blank" rel="noreferrer">
                {action.label}
                <ArrowUpRight />
              </a>
            )}
          </Button>
          {isBlocked && (
            <span className="text-xs text-gray-11">
              {t(
                'Your server URL is not reachable from the internet, so this client cannot dial it.',
              )}
            </span>
          )}
        </div>
      )}
      {(!action || install.command) && (
        <CopyField
          value={copyValue}
          isCommand={isCommand}
          onCopy={home.startWatching}
        />
      )}
      <p className="text-sm text-gray-11">{install.body}</p>
      {client.config && (
        <CopyButton
          textToCopy={client.config.snippet}
          variant="outline"
          size="xs"
          className="self-start"
          onClickCapture={home.startWatching}
        >
          {t('Copy config')}
        </CopyButton>
      )}
      {authenticate && (
        <p className="flex items-start gap-2 text-xs text-gray-11">
          <KeyRound className="mt-px size-3.5 shrink-0" />
          {authenticate.body}
        </p>
      )}
    </div>
  );
}

export function CopyField({
  value,
  isCommand,
  onCopy,
}: {
  value: string;
  isCommand: boolean;
  onCopy: () => void;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setIsCopied(true);
        onCopy();
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => setIsCopied(false));
  };
  return (
    <button
      type="button"
      onClick={copy}
      data-theme={isCommand ? 'dark' : undefined}
      className={cn(
        'group flex h-12 w-full items-center gap-3 rounded-xl pl-4 pr-2 text-left transition-colors',
        isCommand
          ? 'bg-gray-2 ring-1 ring-gray-6 hover:bg-gray-3'
          : 'bg-gray-3 hover:bg-gray-4',
      )}
    >
      {isCommand && (
        <span className="shrink-0 font-mono text-sm text-success-11">$</span>
      )}
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-gray-12">
        {value}
      </span>
      <span
        className={cn(
          'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
          isCopied
            ? 'bg-success-3 text-success-11'
            : 'bg-gray-12 text-gray-1 group-hover:bg-gray-11',
        )}
      >
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {isCopied ? t('Copied') : t('Copy')}
      </span>
    </button>
  );
}

export function ClientLogo({
  client,
  className,
}: {
  client: Pick<CatalogClient, 'icon'>;
  className?: string;
}) {
  return (
    <LogoPlate
      src={client.icon}
      alt=""
      border
      className={cn('size-10 rounded-lg', className)}
      innerClassName="size-[62%]"
    />
  );
}

export function GrantLogo({
  grant,
  className,
}: {
  grant: McpOAuthGrant;
  className?: string;
}) {
  return (
    <ClientLogo
      client={{ icon: mcpClientDisplay.icon(grant.clientKey) }}
      className={className}
    />
  );
}

export function grantName(grant: McpOAuthGrant): string {
  return mcpClientDisplay.label({
    key: grant.clientKey,
    clientName: grant.clientName,
  });
}

export function GrantStatus({ grant }: { grant: McpOAuthGrant }) {
  const isLive = grant.lastUsedAt !== null;
  return (
    <span className="flex items-center gap-2 text-sm text-gray-11">
      <span className="relative flex size-2">
        {isLive && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-10 opacity-60 motion-reduce:animate-none" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            isLive ? 'bg-success-10' : 'bg-gray-9',
          )}
        />
      </span>
      {grant.lastUsedAt === null
        ? t('Waiting for first call')
        : t('Used {ago}', {
            ago: formatUtils.formatDateToAgo(new Date(grant.lastUsedAt)),
          })}
      <span className="text-gray-9">·</span>
      {grant.projectName ?? t('All projects')}
    </span>
  );
}

export function PromptList({ home }: { home: ConnectHome }) {
  return (
    <div className="flex flex-col">
      {home.prompts.map((prompt) => (
        <PromptRow key={prompt} prompt={prompt} />
      ))}
    </div>
  );
}

function PromptRow({ prompt }: { prompt: string }) {
  const [isCopied, setIsCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(prompt)
          .then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          })
          .catch(() => setIsCopied(false));
      }}
      className="group flex items-center gap-4 border-b border-gray-6 py-4 text-left last:border-b-0"
    >
      <span className="min-w-0 flex-1 text-base text-gray-12">“{prompt}”</span>
      <span
        className={cn(
          'flex shrink-0 items-center gap-1.5 text-xs font-medium transition-opacity',
          isCopied
            ? 'text-success-11 opacity-100'
            : 'text-gray-11 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
        )}
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? t('Copied') : t('Copy prompt')}
      </span>
    </button>
  );
}

export function ControlLinks() {
  const nav = useMcpNav();
  const links = [
    {
      icon: ShieldCheck,
      title: t('Manage access'),
      body: t('Which clients reach which projects'),
      tab: 'connections',
    },
    {
      icon: Blocks,
      title: t('Choose tools'),
      body: t('Turn tool groups and pieces on or off'),
      tab: 'tools',
    },
    {
      icon: Activity,
      title: t('See activity'),
      body: t('The piece actions your AI ran'),
      tab: 'activity',
    },
  ];
  return (
    <div className="flex flex-col">
      {links.map((link) => (
        <button
          key={link.tab}
          type="button"
          onClick={() => nav.showTab(link.tab)}
          className="group flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-gray-3"
        >
          <link.icon className="size-4 shrink-0 text-gray-11" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium">{link.title}</span>
            <span className="text-xs text-gray-11">{link.body}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-gray-9 transition-transform group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  );
}

export function FullStepsLink({ client }: { client: CatalogClient }) {
  const nav = useMcpNav();
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => nav.showClient(client.key)}
    >
      {t('Full steps')}
      <ArrowRight />
    </Button>
  );
}

export function WaitingNote({ home }: { home: ConnectHome }) {
  if (!home.isWatching || home.isConnected) return null;
  return (
    <span className="flex items-center gap-2 text-xs text-gray-11">
      <span className="size-1.5 animate-pulse rounded-full bg-accent-10 motion-reduce:animate-none" />
      {t('Waiting for your client to sign in. This page updates on its own.')}
    </span>
  );
}

export function PieceStrip({ home }: { home: ConnectHome }) {
  if (home.pieceLogos.length === 0) return null;
  const extra = home.pieceCount - home.pieceLogos.length;
  return (
    <div className="flex items-center gap-2">
      {home.pieceLogos.map((piece) => (
        <LogoPlate
          key={piece.name}
          src={piece.logoUrl}
          alt={piece.name}
          title={piece.name}
          border
          className="size-9 rounded-lg p-2"
        />
      ))}
      {extra > 0 && (
        <span className="text-sm text-gray-11">
          {t('+{count} more', { count: extra })}
        </span>
      )}
    </div>
  );
}

export function headlineCopy(brandName: string) {
  return {
    title: t('Let your AI do the work.'),
    body: t(
      'Connect Claude, Cursor or any MCP client to {brand}. It runs actions in your apps, builds flows and works with your tables, only in the projects you approve.',
      { brand: brandName },
    ),
  };
}
