import { t } from 'i18next';
import { ExternalLink, MessageSquare, Plug } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { CatalogClient, ConnectStep } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { BackLink } from './back-link';

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
    <div className="flex flex-col bg-background">
      <div className="border-b">
        <PageBand className="flex flex-col gap-4.5 pb-6 pt-8">
          <BackLink label={t('All clients')} onClick={nav.showLanding} />
          <div className="flex flex-wrap items-center gap-4">
            <ClientIcon icon={client.icon} className="size-[52px] rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="text-[26px] font-bold leading-8 tracking-[-0.025em]">
                {client.name}
              </h1>
              <span className="text-[13.5px] text-muted-foreground">
                {client.subtitle}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={client.docsUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {t('Watch the full setup')}
              </span>
              <video
                src={client.setupVideoUrl}
                controls
                preload="metadata"
                playsInline
                className="w-full rounded-[11px] border bg-black"
              />
            </div>
          )}
          {client.steps.map((step, index) => (
            <ConnectStepItem
              key={step.title}
              number={index + 1}
              step={step}
              config={index === 0 ? client.config : undefined}
              isLast={index === client.steps.length - 1}
              isReachableFromInternet={isReachableFromInternet}
            />
          ))}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[344px]">
          <div className="flex flex-col gap-2.5 rounded-[11px] border p-4.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {t('Server URL')}
            </span>
            <span className="break-all font-mono text-[11.5px] leading-[18px]">
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
            className="flex items-center gap-2.5 rounded-[11px] border px-4 py-3.5 text-left transition-colors hover:border-ring"
          >
            <Plug className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-[13px] text-muted-foreground">
              {t('Using something else?')}
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-primary">
              {t('All {total} clients', { total: totalClients })}
            </span>
          </button>
        </div>
      </PageBand>
    </div>
  );
}

function ConnectStepItem({
  number,
  step,
  config,
  isLast,
  isReachableFromInternet,
}: {
  number: number;
  step: ConnectStep;
  config?: { label: string; snippet: string };
  isLast: boolean;
  isReachableFromInternet: boolean;
}) {
  const blockedByPrivateUrl =
    step.action?.requiresInternetReachableUrl === true &&
    !isReachableFromInternet;

  return (
    <div className="flex gap-4">
      <div className="flex w-6 shrink-0 flex-col items-center gap-1.5">
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
          {number}
        </span>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div
        className={cn('flex min-w-0 flex-1 flex-col gap-3', {
          'pb-7': !isLast,
        })}
      >
        <div className="flex flex-col gap-[3px]">
          <span className="text-[15px] font-bold tracking-[-0.01em]">
            {step.title}
          </span>
          <span className="text-[13px] text-muted-foreground">{step.body}</span>
        </div>
        {step.command && <TerminalBlock command={step.command} />}
        {step.action && (
          <Button
            size="sm"
            className="self-start"
            disabled={blockedByPrivateUrl}
            asChild={!blockedByPrivateUrl}
          >
            {blockedByPrivateUrl ? (
              <span>{step.action.label}</span>
            ) : (
              <a href={step.action.href}>{step.action.label}</a>
            )}
          </Button>
        )}
        {blockedByPrivateUrl && (
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            {t(
              'Your server URL is not reachable from the internet, so this client cannot dial it.',
            )}
          </span>
        )}
        {step.prompts && (
          <div className="flex flex-col gap-2">
            {step.prompts.map((prompt) => (
              <span
                key={prompt}
                className="flex items-center gap-2.5 rounded-[9px] border px-3.5 py-2.5 text-[13px]"
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
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
    <div className="flex flex-col overflow-hidden rounded-lg">
      <div className="flex items-center gap-2 bg-[#1E1C1B] px-3.5 py-2">
        <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
          {t('Terminal')}
        </span>
        <CopyButton
          textToCopy={command}
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 rounded-sm bg-white/10 px-2.5 py-1 text-[11.5px] text-neutral-200 hover:bg-white/20 hover:text-white"
        >
          {t('Copy')}
        </CopyButton>
      </div>
      <div className="flex items-start gap-3 overflow-x-auto bg-[#141414] px-4 py-4">
        <span className="shrink-0 font-mono text-[12.5px] leading-[21px] text-emerald-300">
          $
        </span>
        <pre className="min-w-0 whitespace-pre-wrap break-all font-mono text-[12.5px] leading-[21px] text-neutral-200">
          {command}
        </pre>
      </div>
    </div>
  );
}
