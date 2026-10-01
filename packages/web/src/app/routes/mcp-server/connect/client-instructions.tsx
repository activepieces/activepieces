import { t } from 'i18next';
import { ExternalLink, MessageSquare, Plug } from 'lucide-react';

import { BackLink } from '@/components/custom/back-link';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { CatalogClient, SetupInstruction } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

export function ClientInstructions({
  client,
  serverUrl,
  isReachableFromInternet,
  totalClients,
}: {
  client: CatalogClient;
  serverUrl: string;
  isReachableFromInternet: boolean;
  totalClients: number;
}) {
  const nav = useMcpNav();
  return (
    <>
      <div className="flex flex-col gap-4">
        <BackLink label={t('All clients')} onClick={nav.showLanding} />
        <div className="flex flex-wrap items-center gap-4">
          <ClientIcon icon={client.icon} className="size-10 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-base font-semibold text-gray-12">
              {client.name}
            </h2>
            <span className="text-xs text-gray-11">{client.subtitle}</span>
          </div>
          <Button variant="outline" asChild>
            <a href={client.docsUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              {t('{client} docs', { client: client.name })}
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Panel className="min-w-0 flex-1">
          {client.setupVideoUrl && (
            <div className="mb-4 flex flex-col gap-2">
              <span className="text-xs font-medium text-gray-11">
                {t('Watch the full setup')}
              </span>
              <video
                src={client.setupVideoUrl}
                controls
                preload="metadata"
                playsInline
                data-theme="dark"
                className="w-full rounded-xl border bg-gray-1"
              />
            </div>
          )}
          <div className="flex flex-col">
            {client.instructions.map((instruction, index) => (
              <SetupInstructionItem
                key={instruction.title}
                number={index + 1}
                instruction={instruction}
                config={index === 0 ? client.config : undefined}
                isLast={index === client.instructions.length - 1}
                isReachableFromInternet={isReachableFromInternet}
              />
            ))}
          </div>
        </Panel>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[344px]">
          <Panel title={t('Server URL')}>
            <span className="font-mono text-sm break-all">{serverUrl}</span>
            <div className="flex items-center gap-2">
              <CopyButton textToCopy={serverUrl} variant="default" size="sm">
                {t('Copy link')}
              </CopyButton>
              {client.config && (
                <CopyButton
                  textToCopy={client.config.snippet}
                  variant="outline"
                  size="sm"
                >
                  {t('Copy config')}
                </CopyButton>
              )}
            </div>
          </Panel>
          <Card
            variant="interactive"
            role="button"
            tabIndex={0}
            onClick={nav.showBrowse}
            className="flex-row items-center gap-2 px-4"
          >
            <Plug className="size-4 shrink-0 text-gray-11" />
            <span className="flex-1 text-sm text-gray-11">
              {t('Using something else?')}
            </span>
            <span className="shrink-0 text-sm font-medium text-accent-11">
              {t('All {total} clients', { total: totalClients })}
            </span>
          </Card>
        </div>
      </div>
    </>
  );
}

function SetupInstructionItem({
  number,
  instruction,
  config,
  isLast,
  isReachableFromInternet,
}: {
  number: number;
  instruction: SetupInstruction;
  config?: { label: string; snippet: string };
  isLast: boolean;
  isReachableFromInternet: boolean;
}) {
  const blockedByPrivateUrl =
    instruction.action?.requiresInternetReachableUrl === true &&
    !isReachableFromInternet;

  return (
    <div className="flex gap-4">
      <div className="flex w-6 shrink-0 flex-col items-center gap-1.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-12 text-xs font-semibold text-gray-1 tabular-nums">
          {number}
        </span>
        {!isLast && <div className="w-px flex-1 bg-gray-6" />}
      </div>
      <div
        className={cn('flex min-w-0 flex-1 flex-col gap-3', {
          'pb-6': !isLast,
        })}
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{instruction.title}</span>
          <span className="text-xs text-gray-11">{instruction.body}</span>
        </div>
        {instruction.command && <TerminalBlock command={instruction.command} />}
        {instruction.action && (
          <Button
            size="sm"
            className="self-start"
            disabled={blockedByPrivateUrl}
            asChild={!blockedByPrivateUrl}
          >
            {blockedByPrivateUrl ? (
              <span>{instruction.action.label}</span>
            ) : (
              <a href={instruction.action.href}>{instruction.action.label}</a>
            )}
          </Button>
        )}
        {blockedByPrivateUrl && (
          <span className="text-xs text-gray-11">
            {t(
              'Your server URL is not reachable from the internet, so this client cannot dial it.',
            )}
          </span>
        )}
        {instruction.prompts && (
          <div className="flex flex-col gap-2">
            {instruction.prompts.map((prompt) => (
              <span
                key={prompt}
                className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
              >
                <MessageSquare className="size-3.5 shrink-0 text-gray-11" />
                {prompt}
              </span>
            ))}
          </div>
        )}
        {config && (
          <CollapsibleJson json={config.snippet} label={config.label} />
        )}
      </div>
    </div>
  );
}

function TerminalBlock({ command }: { command: string }) {
  return (
    <div data-theme="dark" className="flex flex-col overflow-hidden rounded-xl">
      <div className="flex items-center gap-2 bg-gray-3 py-1 pr-1 pl-3">
        <span className="flex-1 text-xs font-medium text-gray-11">
          {t('Terminal')}
        </span>
        <CopyButton textToCopy={command} variant="ghost" size="xs">
          {t('Copy')}
        </CopyButton>
      </div>
      <div className="flex items-start gap-3 overflow-x-auto bg-gray-2 p-3">
        <span className="shrink-0 font-mono text-sm text-success-11">$</span>
        <pre className="min-w-0 font-mono text-sm break-all whitespace-pre-wrap text-gray-12">
          {command}
        </pre>
      </div>
    </div>
  );
}
