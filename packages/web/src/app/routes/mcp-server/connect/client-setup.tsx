import { t } from 'i18next';
import { ExternalLink, Globe, MessageSquare } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Panel } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  CatalogClient,
  SetupBlock,
  SetupMethod,
  SetupStep,
} from '../mcp-client-catalog';

export function ClientSetup({
  client,
  serverUrl,
  connected,
  isReachableFromInternet,
}: {
  client: CatalogClient;
  serverUrl: string;
  connected: boolean;
  isReachableFromInternet: boolean;
}) {
  const unreachable = client.needsPublicUrl && !isReachableFromInternet;

  return (
    <Panel flush className="min-w-0">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <LogoPlate
          src={client.icon}
          alt=""
          size="md"
          border
          className="rounded-lg"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-base font-semibold text-gray-12">
            {t('Connect {client}', { client: client.name })}
          </h2>
          {connected ? (
            <StatusDot tone="success" className="text-xs text-gray-11">
              {t('Connected. Set it up again to add another device.')}
            </StatusDot>
          ) : (
            <span className="text-xs text-gray-11">{client.hint}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={client.docsUrl} target="_blank" rel="noreferrer">
            <span className="hidden sm:inline">
              {t('{client} docs', { client: client.name })}
            </span>
            <span className="sm:hidden">{t('Docs')}</span>
            <ExternalLink />
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {unreachable && (
          <Alert variant="warning">
            <Globe />
            <AlertDescription>
              {t(
                '{client} runs on its own servers and dials your server URL from the internet, and this one is not reachable from there. Expose it publicly, or use a client that runs on your own machine.',
                { client: client.name },
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={client.methods[0].key} className="gap-4">
          {client.methods.length > 1 && (
            <TabsList>
              {client.methods.map((method) => (
                <TabsTrigger key={method.key} value={method.key}>
                  {method.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
          {client.methods.map((method) => (
            <TabsContent
              key={method.key}
              value={method.key}
              tabIndex={-1}
              className="flex flex-col gap-4"
            >
              <MethodSteps
                method={method}
                blocked={unreachable && method.key !== 'agent'}
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex flex-col gap-2 border-t pt-4">
          <span className="text-sm font-medium text-gray-12">
            {t('Then try')}
          </span>
          <CopyBlock
            block={{
              kind: 'prompt',
              label: t('Prompt'),
              text: client.tryPrompt,
            }}
          />
        </div>

        <div className="flex flex-col gap-2 border-t pt-4 lg:hidden">
          <CopyBlock
            block={{ kind: 'url', label: t('Server URL'), text: serverUrl }}
          />
        </div>

        {client.setupVideoUrl && (
          <details className="group border-t pt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-12 marker:text-gray-9">
              {t('Watch the full setup')}
            </summary>
            <video
              src={client.setupVideoUrl}
              controls
              preload="metadata"
              playsInline
              data-theme="dark"
              className="mt-3 w-full rounded-xl border bg-gray-1"
            />
          </details>
        )}
      </div>
    </Panel>
  );
}

function MethodSteps({
  method,
  blocked,
}: {
  method: SetupMethod;
  blocked: boolean;
}) {
  return (
    <>
      <p className="text-sm text-gray-11">{method.hint}</p>
      <ol className="flex flex-col">
        {method.steps.map((step, index) => (
          <StepItem
            key={step.body}
            number={index + 1}
            step={step}
            isLast={index === method.steps.length - 1}
            blocked={blocked}
          />
        ))}
      </ol>
    </>
  );
}

function StepItem({
  number,
  step,
  isLast,
  blocked,
}: {
  number: number;
  step: SetupStep;
  isLast: boolean;
  blocked: boolean;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex w-6 shrink-0 flex-col items-center gap-1">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-12 text-xs font-medium text-gray-1 tabular-nums">
          {number}
        </span>
        {!isLast && <span aria-hidden className="w-px flex-1 bg-gray-6" />}
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-2 pt-0.5',
          !isLast && 'pb-6',
        )}
      >
        <p className="text-sm text-gray-12">{step.body}</p>
        {step.block && <CopyBlock block={step.block} />}
        {step.action && (
          <Button className="w-fit" disabled={blocked} asChild={!blocked}>
            {blocked ? (
              <span>{step.action.label}</span>
            ) : (
              <a
                href={step.action.href}
                target={
                  step.action.href.startsWith('http') ? '_blank' : undefined
                }
                rel="noreferrer"
              >
                {step.action.label}
                {step.action.href.startsWith('http') && <ExternalLink />}
              </a>
            )}
          </Button>
        )}
      </div>
    </li>
  );
}

function CopyBlock({ block }: { block: SetupBlock }) {
  if (block.kind === 'terminal') {
    return (
      <div
        data-theme="dark"
        className="flex flex-col overflow-hidden rounded-xl border bg-gray-2 text-gray-12"
      >
        <BlockHeader label={block.label} text={block.text} />
        <div className="flex items-start gap-3 overflow-x-auto p-3">
          <span className="shrink-0 font-mono text-sm text-success-11">$</span>
          <pre className="min-w-0 font-mono text-sm break-all whitespace-pre-wrap text-gray-12">
            {block.text}
          </pre>
        </div>
      </div>
    );
  }
  if (block.kind === 'prompt') {
    return (
      <div className="flex items-start gap-3 rounded-xl border bg-gray-2 py-1 pr-1 pl-3">
        <MessageSquare className="mt-2 size-3.5 shrink-0 text-gray-11" />
        <p className="min-w-0 flex-1 py-1.5 text-sm text-gray-12">
          {block.text}
        </p>
        <CopyButton
          textToCopy={block.text}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          {t('Copy')}
        </CopyButton>
      </div>
    );
  }
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-gray-2">
      <BlockHeader label={block.label} text={block.text} />
      <pre
        className={cn(
          'overflow-x-auto p-3 font-mono text-gray-12',
          block.kind === 'code'
            ? 'text-xs'
            : 'text-sm break-all whitespace-pre-wrap',
        )}
      >
        {block.text}
      </pre>
    </div>
  );
}

function BlockHeader({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center gap-2 border-b py-1 pr-1 pl-3">
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-11">
        {label}
      </span>
      <CopyButton textToCopy={text} variant="ghost" size="xs">
        {t('Copy')}
      </CopyButton>
    </div>
  );
}
