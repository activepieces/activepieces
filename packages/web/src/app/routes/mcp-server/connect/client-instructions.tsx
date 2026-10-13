import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { BackLink } from '@/components/custom/back-link';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import {
  CatalogClient,
  mcpClientCatalog,
  SetupStep as SetupStepModel,
} from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

import { connectStatus } from './connect-status';
import { SetupCodeBlock } from './setup-code-block';

export function ClientInstructions({
  client,
  grants,
  serverUrl,
  isReachableFromInternet,
}: {
  client: CatalogClient;
  grants: McpOAuthGrant[] | undefined;
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const nav = useMcpNav();
  const { websiteName } = flagsHooks.useWebsiteBranding();
  const [methodKey, setMethodKey] = useState(client.methods[0].key);
  const method =
    client.methods.find((item) => item.key === methodKey) ?? client.methods[0];
  const steps = method.steps.length + 1;

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-6 pb-16 pt-8">
      <div className="flex flex-col gap-6">
        <BackLink label={t('All clients')} onClick={nav.showLanding} />
        <header className="flex flex-wrap items-center gap-4">
          <ClientIcon icon={client.icon} className="size-14 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {client.name}
            </h1>
            <span className="text-sm text-gray-11">
              {clientSubtitle(client)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="order-last basis-full justify-start px-0 sm:order-none sm:basis-auto sm:px-3"
            asChild
          >
            <a href={client.docsUrl} target="_blank" rel="noreferrer">
              {t('{client} docs', { client: client.name })}
              <ArrowUpRight />
            </a>
          </Button>
        </header>
        <ConnectionStatus
          clientName={client.name}
          grants={grants}
          onManage={() => nav.showTab('connections')}
        />
      </div>

      <div className="flex flex-col gap-6">
        {client.methods.length > 1 && (
          <div className="flex flex-col gap-2.5">
            <Tabs value={method.key} onValueChange={setMethodKey}>
              <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
                {client.methods.map((item, index) => (
                  <TabsTrigger
                    key={item.key}
                    value={item.key}
                    className="h-8 gap-1.5"
                  >
                    {item.label}
                    {index === 0 && (
                      <span className="rounded-full bg-accent-3 px-1.5 py-0.5 text-xs font-medium leading-none text-accent-11">
                        {t('Recommended')}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-sm text-gray-11">{method.hint}</p>
          </div>
        )}
        {client.methods.length === 1 && (
          <p className="text-sm text-gray-11">{method.hint}</p>
        )}

        <ol key={method.key} className="flex flex-col">
          {method.steps.map((step, index) => (
            <SetupStep
              key={index}
              number={index + 1}
              isLast={false}
              step={step}
              isReachableFromInternet={isReachableFromInternet}
            />
          ))}
          <CheckStep
            number={steps}
            prompts={mcpClientCatalog.checkPrompts(websiteName)}
          />
        </ol>
      </div>

      {client.setupVideoUrl && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-11">
            {t('Watch the full setup')}
          </h2>
          <video
            src={client.setupVideoUrl}
            controls
            preload="metadata"
            playsInline
            data-theme="dark"
            className="w-full rounded-xl border bg-gray-1"
          />
        </section>
      )}

      <section className="flex flex-col gap-3 border-t pt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-11">
          {t('Server URL')}
        </h2>
        <CopyToClipboardInput textToCopy={serverUrl} useInput />
      </section>
    </div>
  );
}

function ConnectionStatus({
  clientName,
  grants,
  onManage,
}: {
  clientName: string;
  grants: McpOAuthGrant[] | undefined;
  onManage: () => void;
}) {
  if (grants) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success-6 bg-success-2 px-4 py-3">
        <span className="size-2 shrink-0 rounded-full bg-success-10" />
        <span className="flex-1 text-sm">
          <span className="font-semibold">
            {t('{client} is connected', { client: clientName })}
          </span>
          <span className="text-gray-11"> · {connectStatus.usage(grants)}</span>
        </span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={onManage}
        >
          {t('Manage')}
        </Button>
      </div>
    );
  }
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-panel px-4 py-3"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-9 opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-accent-10" />
      </span>
      <span className="flex-1 text-sm font-medium">
        {t('Waiting for {client} to sign in…', { client: clientName })}
      </span>
      <span className="hidden text-xs text-gray-11 sm:inline">
        {t('This page updates on its own.')}
      </span>
    </div>
  );
}

function SetupStep({
  number,
  isLast,
  step,
  isReachableFromInternet,
}: {
  number: number;
  isLast: boolean;
  step: SetupStepModel;
  isReachableFromInternet: boolean;
}) {
  const isBlocked =
    step.action?.requiresInternetReachableUrl === true &&
    !isReachableFromInternet;
  return (
    <StepRail number={number} isLast={isLast}>
      <p className="pt-1 text-sm text-gray-12">{step.body}</p>
      {step.block && <SetupCodeBlock block={step.block} />}
      {step.action && (
        <Button
          size="sm"
          className="self-start"
          disabled={isBlocked}
          asChild={!isBlocked}
        >
          {isBlocked ? (
            <span>{step.action.label}</span>
          ) : (
            <a href={step.action.href} target="_blank" rel="noreferrer">
              {step.action.label}
              <ArrowUpRight />
            </a>
          )}
        </Button>
      )}
      {isBlocked && (
        <p className="text-sm text-gray-11">
          {t(
            'Your server URL is not reachable from the internet, so this client cannot dial it.',
          )}
        </p>
      )}
    </StepRail>
  );
}

function CheckStep({ number, prompts }: { number: number; prompts: string[] }) {
  return (
    <StepRail number={number} isLast>
      <div className="flex flex-col gap-1 pt-1">
        <p className="text-sm font-semibold">{t('Check it works')}</p>
        <p className="text-sm text-gray-11">
          {t('Ask one of these. If it answers with your tools, you’re set.')}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {prompts.map((prompt) => (
          <CopyButton
            key={prompt}
            textToCopy={prompt}
            variant="outline"
            className="h-auto justify-start whitespace-normal rounded-xl bg-panel px-3.5 py-2.5 text-left font-normal"
          >
            {prompt}
          </CopyButton>
        ))}
      </div>
    </StepRail>
  );
}

function StepRail({
  number,
  isLast,
  children,
}: {
  number: number;
  isLast: boolean;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-panel text-xs font-semibold tabular-nums">
          {number}
        </span>
        {!isLast && <span className="mt-2 w-px flex-1 bg-gray-6" />}
      </div>
      <div className={cn('flex min-w-0 flex-col gap-3', !isLast && 'pb-7')}>
        {children}
      </div>
    </li>
  );
}

function clientSubtitle(client: CatalogClient): string {
  switch (client.kind) {
    case 'chat':
      return t('Chat app · needs a public HTTPS address');
    case 'agent':
      return t('Coding agent · runs locally');
    case 'editor':
      return t('Code editor · runs locally');
    case 'other':
      return t('Streamable HTTP · OAuth');
  }
}
