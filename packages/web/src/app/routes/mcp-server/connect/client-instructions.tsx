import {
  BubbleChatIcon,
  LinkSquare02Icon,
  PlugSocketIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { BackLink } from '@/components/custom/back-link';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { CatalogClient, SetupInstruction } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

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
    <div className="flex flex-col bg-gray-1">
      <div className="border-b">
        <PageBand className="flex flex-col gap-4.5 pb-6 pt-8">
          <BackLink label={t('All clients')} onClick={nav.showLanding} />
          <div className="flex flex-wrap items-center gap-4">
            <ClientIcon icon={client.icon} className="size-13 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="text-2xl font-bold leading-8 tracking-tight">
                {client.name}
              </h1>
              <span className="text-sm text-gray-11">{client.subtitle}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={client.docsUrl} target="_blank" rel="noreferrer">
                <HugeiconsIcon icon={LinkSquare02Icon} />
                {t('{client} docs', { client: client.name })}
              </a>
            </Button>
          </div>
        </PageBand>
      </div>

      <PageBand className="flex flex-col gap-8 pb-10 pt-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          {client.setupVideoUrl && (
            <div className="mb-8 flex flex-col gap-2">
              <span className="text-xss font-semibold uppercase tracking-wider text-gray-11">
                {t('Watch the full setup')}
              </span>
              <video
                src={client.setupVideoUrl}
                controls
                preload="metadata"
                playsInline
                data-theme="dark"
                className="w-full rounded-md border bg-gray-1"
              />
            </div>
          )}
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

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[344px]">
          <div className="flex flex-col gap-2.5 rounded-md border p-4.5">
            <span className="text-xss font-semibold uppercase tracking-wider text-gray-11">
              {t('Server URL')}
            </span>
            <span className="break-all font-mono text-xs leading-normal">
              {serverUrl}
            </span>
            <div className="flex items-center gap-2 pt-1">
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
          </div>
          <button
            type="button"
            onClick={nav.showBrowse}
            className="flex items-center gap-2.5 rounded-md border px-4 py-3.5 text-left transition-colors hover:border-accent-8"
          >
            <HugeiconsIcon
              icon={PlugSocketIcon}
              className="size-4 shrink-0 text-gray-11"
            />
            <span className="flex-1 text-sm text-gray-11">
              {t('Using something else?')}
            </span>
            <span className="shrink-0 text-sm font-semibold text-accent-11">
              {t('All {total} clients', { total: totalClients })}
            </span>
          </button>
        </div>
      </PageBand>
    </div>
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
        <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-gray-12 text-xss font-semibold text-gray-1">
          {number}
        </span>
        {!isLast && <div className="w-px flex-1 bg-gray-6" />}
      </div>
      <div
        className={cn('flex min-w-0 flex-1 flex-col gap-3', {
          'pb-7': !isLast,
        })}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">{instruction.title}</span>
          <span className="text-sm text-gray-11">{instruction.body}</span>
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
          <span className="text-sm leading-relaxed text-gray-11">
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
                className="flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm"
              >
                <HugeiconsIcon
                  icon={BubbleChatIcon}
                  className="size-3.5 shrink-0 text-gray-11"
                />
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
    <div data-theme="dark" className="flex flex-col overflow-hidden rounded-lg">
      <div className="flex items-center gap-2 bg-gray-3 px-3.5 py-2">
        <span className="flex-1 text-xss font-semibold uppercase tracking-wider text-gray-11">
          {t('Terminal')}
        </span>
        <CopyButton
          textToCopy={command}
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 rounded-sm bg-gray-4 px-2.5 py-1 text-xs text-gray-12/80 hover:bg-gray-5 hover:text-gray-12"
        >
          {t('Copy')}
        </CopyButton>
      </div>
      <div className="flex items-start gap-3 overflow-x-auto bg-gray-2 px-4 py-4">
        <span className="shrink-0 font-mono text-xs leading-relaxed text-success-11">
          $
        </span>
        <pre className="min-w-0 whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-gray-12/80">
          {command}
        </pre>
      </div>
    </div>
  );
}
