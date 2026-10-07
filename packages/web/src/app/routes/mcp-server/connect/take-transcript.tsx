import { t } from 'i18next';
import { Check, Plus, Wrench } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { PageBand } from '../page-band';

import {
  ClientLogo,
  ConnectAction,
  ControlLinks,
  FullStepsLink,
  GrantLogo,
  GrantStatus,
  WaitingNote,
  grantName,
  headlineCopy,
} from './connect-kit';
import { ConnectHome } from './use-connect-home';

export function TakeTranscript(props: TakeProps) {
  const { home } = props;
  const [isAdding, setIsAdding] = useState(false);
  const showConnect = !home.isConnected || isAdding;
  const copy = headlineCopy(home.brandName);

  return (
    <PageBand className="grid grid-cols-1 items-start gap-16 py-16 lg:grid-cols-[1fr_420px]">
      <div className="flex min-w-0 flex-col gap-8">
        {home.isConnected ? (
          <ConnectedComposer home={home} />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight">
                {copy.title}
              </h1>
              <p className="max-w-[540px] text-base text-gray-11">
                {copy.body}
              </p>
            </div>
            <ExampleTranscript home={home} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-6 rounded-xl border bg-panel p-6 shadow-sm">
        {showConnect ? (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium text-gray-11">
                  {isAdding
                    ? t('Connect another client')
                    : t('Pick your client')}
                </span>
                {isAdding && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsAdding(false)}
                  >
                    {t('Cancel')}
                  </Button>
                )}
              </div>
              <LogoRow home={home} />
            </div>
            <div className="flex items-center gap-3">
              <ClientLogo
                client={home.selected}
                className="size-12 rounded-xl"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xl font-semibold tracking-tight">
                  {home.selected.name}
                </span>
                <span className="text-xs text-gray-11">
                  {home.selected.subtitle}
                </span>
              </div>
              <FullStepsLink client={home.selected} />
            </div>
            <ConnectAction {...props} />
            <WaitingNote home={home} />
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-gray-11">
              {t('Stay in control')}
            </span>
            <ControlLinks />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus />
              {t('Connect another client')}
            </Button>
          </>
        )}
      </div>
    </PageBand>
  );
}

function ExampleTranscript({ home }: { home: ConnectHome }) {
  const steps = [
    { tool: 'ap_list_runs', label: t('Listed this week’s runs') },
    { tool: 'ap_get_run', label: t('Opened the failed run') },
  ];
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-panel p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ClientLogo client={home.selected} className="size-6 rounded-md" />
        <span className="flex-1 text-sm font-medium">{home.selected.name}</span>
        <span className="text-xs text-gray-11">{t('Example')}</span>
      </div>
      <div className="flex justify-end">
        <span className="max-w-[80%] rounded-xl bg-gray-12 px-4 py-2.5 text-sm text-gray-1 animate-in fade-in slide-in-from-bottom-1 duration-500 fill-mode-both motion-reduce:animate-none">
          {t('Which of my flows failed this week, and why?')}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <span
            key={step.tool}
            className={cn(
              'flex items-center gap-2 self-start rounded-lg bg-gray-3 px-3 py-1.5 text-xs animate-in fade-in slide-in-from-left-1 duration-500 fill-mode-both motion-reduce:animate-none',
              index === 0 ? 'delay-700' : 'delay-1000',
            )}
          >
            <Wrench className="size-3.5 text-gray-11" />
            <span className="font-mono text-gray-12">{step.tool}</span>
            <span className="text-gray-11">{step.label}</span>
            <Check className="size-3.5 text-success-11" />
          </span>
        ))}
      </div>
      <p className="max-w-[90%] text-sm text-gray-12 animate-in fade-in duration-700 delay-1000 fill-mode-both motion-reduce:animate-none">
        {t(
          'Found the failed run and the step that broke. Want me to fix the flow and test it again?',
        )}
      </p>
    </div>
  );
}

function ConnectedComposer({ home }: { home: ConnectHome }) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const lead = home.latestGrant;
  const prompt = home.prompts[promptIndex] ?? '';
  const copy = () => {
    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => setIsCopied(false));
  };

  return (
    <>
      {lead && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <div className="flex items-center gap-3">
            {home.grants.map((grant) => (
              <Tooltip key={grant.id}>
                <TooltipTrigger asChild>
                  <span>
                    <GrantLogo grant={grant} className="size-10 rounded-lg" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{grantName(grant)}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            {t('{client} is connected.', { client: grantName(lead) })}
          </h1>
          <GrantStatus grant={lead} />
        </div>
      )}
      <div className="flex flex-col gap-4 rounded-xl border bg-panel p-6 shadow-sm">
        <span className="text-sm font-medium text-gray-11">
          {t('Try asking {client}', {
            client: lead ? grantName(lead) : t('your AI'),
          })}
        </span>
        <div className="flex flex-wrap gap-2">
          {home.prompts.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setPromptIndex(index)}
              className={cn(
                'h-8 max-w-full truncate rounded-lg px-3 text-sm transition-colors',
                index === promptIndex
                  ? 'bg-accent-3 text-accent-11'
                  : 'bg-gray-3 text-gray-11 hover:bg-gray-4 hover:text-gray-12',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-gray-3 py-2 pl-4 pr-2">
          <span className="min-w-0 flex-1 truncate text-base">{prompt}</span>
          <Button size="sm" onClick={copy}>
            {isCopied ? <Check /> : null}
            {isCopied ? t('Copied') : t('Copy prompt')}
          </Button>
        </div>
      </div>
    </>
  );
}

function LogoRow({ home }: { home: ConnectHome }) {
  return (
    <div role="tablist" className="grid grid-cols-5 gap-2">
      {home.clients.map((client) => {
        const isSelected = client.key === home.selected.key;
        return (
          <Tooltip key={client.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={client.name}
                onClick={() => home.select(client.key)}
                className={cn(
                  'flex items-center justify-center rounded-xl p-1.5 transition-all',
                  isSelected
                    ? 'bg-accent-3 ring-2 ring-accent-8'
                    : 'opacity-80 hover:bg-gray-3 hover:opacity-100',
                )}
              >
                <ClientLogo client={client} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{client.name}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

type TakeProps = {
  home: ConnectHome;
  serverUrl: string;
  isReachableFromInternet: boolean;
};
