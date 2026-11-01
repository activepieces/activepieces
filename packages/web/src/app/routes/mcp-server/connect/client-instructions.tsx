import { t } from 'i18next';
import {
  ArrowUpRight,
  FileCode2,
  Globe,
  Link2,
  LucideIcon,
  MessageSquareText,
  MousePointerClick,
  Plug,
  Terminal,
} from 'lucide-react';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { BackLink } from '@/components/custom/back-link';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import {
  AgentPrompt,
  CatalogClient,
  SetupInstruction,
  SetupMethod,
} from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

export function ClientInstructions({
  client,
  isReachableFromInternet,
}: {
  client: CatalogClient;
  isReachableFromInternet: boolean;
}) {
  const nav = useMcpNav();
  const [methodKey, setMethodKey] = useState(client.methods[0].key);
  return (
    <div className="@container w-full">
      <PageBand className="flex flex-col gap-8 py-10">
        <BackLink label={t('All clients')} onClick={nav.showLanding} />
        <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-x-8 gap-y-10 @max-[760px]:grid-cols-1">
          <aside className="flex flex-col gap-10 self-start">
            <Header client={client} />
            <Methods
              methods={client.methods}
              methodKey={methodKey}
              onChange={setMethodKey}
            />
          </aside>
          <div className="grid self-start">
            {client.methods.map((method) => {
              const isActive = method.key === methodKey;
              return (
                <div
                  key={method.key}
                  aria-hidden={!isActive}
                  className={cn(
                    'col-start-1 row-start-1 transition-[opacity,visibility] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    isActive ? 'visible opacity-100' : 'invisible opacity-0',
                  )}
                >
                  <Steps
                    client={client}
                    method={method}
                    isReachableFromInternet={isReachableFromInternet}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </PageBand>
    </div>
  );
}

function Header({ client }: { client: CatalogClient }) {
  const isGeneric = client.key === 'unknown';
  return (
    <div className="flex items-center gap-3.5">
      <ClientIcon icon={client.icon} className="size-13 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-balance text-xl font-semibold leading-7 tracking-tight">
          {isGeneric
            ? t('Set up your MCP client')
            : t('Set up {client}', { client: client.name })}
        </h1>
        <a
          href={client.docsUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'flex w-fit items-center gap-1 rounded-sm text-sm text-gray-11 hover:text-gray-12',
            FOCUS_RING,
          )}
        >
          {isGeneric
            ? t('MCP docs')
            : t('{client} docs', { client: client.name })}
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

function Methods({
  methods,
  methodKey,
  onChange,
}: {
  methods: SetupMethod[];
  methodKey: string;
  onChange: (key: string) => void;
}) {
  const index = Math.max(
    0,
    methods.findIndex((method) => method.key === methodKey),
  );
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-gray-11">{t('How to add it')}</h2>
      <div className="relative flex flex-col gap-1">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-11 rounded-lg border border-gray-6 bg-gray-3 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateY(${index * METHOD_ROW_STEP_PX}px)` }}
        />
        {methods.map((method) => {
          const Icon = methodIcon(method.key);
          const isActive = method.key === methodKey;
          return (
            <button
              key={method.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(method.key)}
              className={cn(
                'relative flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                FOCUS_RING,
                isActive
                  ? 'font-medium text-gray-12'
                  : 'text-gray-11 hover:bg-gray-3/60 hover:text-gray-12',
              )}
            >
              <Icon className="size-4" />
              {method.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Steps({
  client,
  method,
  isReachableFromInternet,
}: {
  client: CatalogClient;
  method: SetupMethod;
  isReachableFromInternet: boolean;
}) {
  const [add, signIn, check] = method.instructions;
  const needsPublicUrl =
    add.action?.requiresInternetReachableUrl === true ||
    method.key === 'connector';
  const isBlocked = needsPublicUrl && !isReachableFromInternet;
  return (
    <ol className="flex flex-col gap-8 border-l pl-8 @max-[760px]:border-l-0 @max-[760px]:border-t @max-[760px]:pl-0 @max-[760px]:pt-8">
      <Step
        number={1}
        title={add.title}
        body={isBlocked ? undefined : add.body}
        isCurrent
      >
        {isBlocked ? (
          <PublicAddressNotice clientName={client.name} />
        ) : (
          <StepAction instruction={add} clientName={client.name} />
        )}
      </Step>
      <Step
        number={2}
        title={signIn.title}
        body={signIn.body}
        isMuted={isBlocked}
      >
        {signIn.command && (
          <CodeFrame
            text={signIn.command}
            label={commandLabel({ text: signIn.command, client: client.name })}
            kind={isShellCommand(signIn.command) ? 'command' : 'value'}
          />
        )}
      </Step>
      <Step
        number={3}
        title={check.title}
        body={check.body}
        isMuted={isBlocked}
      >
        {check.prompt && (
          <CopyButton
            textToCopy={check.prompt}
            variant="outline"
            size="sm"
            className={cn('h-9 self-start font-normal', FOCUS_RING)}
          >
            {check.prompt}
          </CopyButton>
        )}
      </Step>
    </ol>
  );
}

function Step({
  number,
  title,
  body,
  isCurrent = false,
  isMuted = false,
  children,
}: {
  number: number;
  title: string;
  body?: string;
  isCurrent?: boolean;
  isMuted?: boolean;
  children?: ReactNode;
}) {
  return (
    <li
      inert={isMuted || undefined}
      className={cn(
        'grid grid-cols-[24px_minmax(0,1fr)] gap-x-4 gap-y-3',
        isMuted && 'pointer-events-none opacity-50',
      )}
    >
      <span className="flex h-8 items-center">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
            isCurrent ? 'bg-gray-12 text-gray-1' : 'bg-gray-4 text-gray-11',
          )}
        >
          {number}
        </span>
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="flex min-h-8 items-center text-base font-semibold">
          {title}
        </h2>
        {body && <p className="text-sm leading-5 text-gray-11">{body}</p>}
      </div>
      {children && (
        <div className="col-start-2 flex min-w-0 flex-col @max-[640px]:col-span-2 @max-[640px]:col-start-1">
          {children}
        </div>
      )}
    </li>
  );
}

function PublicAddressNotice({ clientName }: { clientName: string }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-gray-2 px-4 py-3">
      <Globe className="mt-0.5 size-4 shrink-0 text-gray-11" />
      <p className="max-w-prose text-pretty text-sm leading-5 text-gray-11">
        <span className="font-medium text-gray-12">
          {t('{client} needs a public address.', { client: clientName })}
        </span>{' '}
        {t(
          'This server is only reachable inside your network. Put it behind a public HTTPS address, then come back to add the connector.',
        )}
      </p>
    </div>
  );
}

function StepAction({
  instruction,
  clientName,
}: {
  instruction: SetupInstruction;
  clientName: string;
}) {
  if (instruction.agentPrompt) {
    return <PromptFrame prompt={instruction.agentPrompt} />;
  }
  if (instruction.snippet) {
    return (
      <CodeFrame
        text={instruction.snippet}
        label={t('Config file')}
        kind="config"
      />
    );
  }
  const commandFrame = instruction.command && (
    <CodeFrame
      text={instruction.command}
      label={commandLabel({ text: instruction.command, client: clientName })}
      kind={isShellCommand(instruction.command) ? 'command' : 'value'}
    />
  );
  if (instruction.action) {
    const isExternal = instruction.action.href.startsWith('http');
    return (
      <div className="flex flex-col gap-3">
        <Button className="self-start" asChild>
          <a
            href={instruction.action.href}
            {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            {instruction.action.label}
            <ArrowUpRight />
          </a>
        </Button>
        {commandFrame}
      </div>
    );
  }
  return commandFrame || null;
}

function CodeFrame({
  text,
  label,
  kind,
}: {
  text: string;
  label: string;
  kind: CodeKind;
}) {
  const ref = useRef<HTMLPreElement>(null);
  const [isClipped, setIsClipped] = useState(false);
  const isConfig = kind === 'config';
  const measure = () => {
    const element = ref.current;
    if (element) {
      setIsClipped(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      );
    }
  };
  useLayoutEffect(measure, [text]);
  return (
    <div
      data-theme="dark"
      className="flex w-full flex-col overflow-hidden rounded-lg border border-gray-5"
    >
      <FrameHeader label={label} text={text} />
      <div className="flex items-start gap-3 bg-gray-2 px-4 py-3">
        {kind === 'command' && (
          <span className="select-none font-mono text-sm leading-6 text-success-11">
            $
          </span>
        )}
        <pre
          ref={ref}
          onScroll={isConfig ? measure : undefined}
          className={cn(
            'min-w-0 flex-1 font-mono text-sm leading-6 text-gray-12',
            isConfig
              ? 'overflow-x-auto whitespace-pre [scrollbar-width:thin]'
              : 'whitespace-pre-wrap break-normal',
            kind === 'command' && 'pl-[2ch] -indent-[2ch]',
            isConfig &&
              isClipped &&
              '[mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)]',
          )}
        >
          {isConfig ? text : codeTokens(text)}
        </pre>
      </div>
    </div>
  );
}

function PromptFrame({ prompt }: { prompt: AgentPrompt }) {
  const text = [prompt.intro, prompt.code, prompt.outro].join('\n\n');
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border">
      <FrameHeader label={t('Prompt')} text={text} />
      <div className="flex flex-col gap-2 bg-gray-1 px-4 py-3 text-sm leading-6 text-gray-12">
        <p className="text-pretty">{prompt.intro}</p>
        <pre className="overflow-x-auto whitespace-pre rounded-md border bg-gray-2 px-3 py-2 font-mono text-xs leading-5 [scrollbar-width:thin]">
          {prompt.code}
        </pre>
        <p className="text-pretty">{prompt.outro}</p>
      </div>
    </div>
  );
}

function FrameHeader({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex h-9 items-center gap-2 border-b bg-gray-3 pl-4 pr-1.5">
      <span className="flex-1 truncate text-xs font-medium text-gray-11">
        {label}
      </span>
      <CopyButton
        textToCopy={text}
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 gap-1.5 px-2 text-xs font-medium text-gray-11 hover:bg-gray-4 hover:text-gray-12',
          FOCUS_RING,
        )}
      >
        {t('Copy')}
      </CopyButton>
    </div>
  );
}

function codeTokens(text: string): ReactNode[] {
  const words = text.split(' ');
  const groups = words.reduce<string[]>((acc, word, index) => {
    const previous = words[index - 1];
    const isFlagValue =
      previous !== undefined &&
      previous.startsWith('-') &&
      !word.startsWith('-') &&
      word.length < FLAG_VALUE_MAX_LENGTH;
    return isFlagValue
      ? [...acc.slice(0, -1), `${acc[acc.length - 1]} ${word}`]
      : [...acc, word];
  }, []);
  return groups.map((group, index) => (
    <span key={index}>
      {index > 0 && ' '}
      <span
        className={cn(
          group.includes(' ') && 'whitespace-nowrap',
          group.includes('://') && 'inline-block max-w-full indent-0',
        )}
      >
        {group.split('/').map((part, partIndex, parts) => (
          <span key={partIndex}>
            {partIndex > 0 && part !== '' && parts[partIndex - 1] !== '' && (
              <wbr />
            )}
            <span className="whitespace-nowrap">
              {partIndex > 0 && '/'}
              {part}
            </span>
          </span>
        ))}
      </span>
    </span>
  ));
}

function methodIcon(key: string): LucideIcon {
  switch (key) {
    case 'deeplink':
    case 'directory':
    case 'app':
      return MousePointerClick;
    case 'terminal':
      return Terminal;
    case 'config':
      return FileCode2;
    case 'url':
      return Link2;
    case 'agent':
      return MessageSquareText;
    default:
      return Plug;
  }
}

function commandLabel({
  text,
  client,
}: {
  text: string;
  client: string;
}): string {
  if (isShellCommand(text)) {
    return t('Terminal');
  }
  if (text.startsWith('/')) {
    return t('Inside {client}', { client });
  }
  return t('Server URL');
}

function isShellCommand(text: string): boolean {
  return SHELL_COMMAND.test(text);
}

const FOCUS_RING =
  'outline-none focus-visible:ring-3 focus-visible:ring-gray-8/50';
const METHOD_ROW_STEP_PX = 48;
const FLAG_VALUE_MAX_LENGTH = 20;
const SHELL_COMMAND = /^[a-z][\w.-]* /;

type CodeKind = 'command' | 'config' | 'value';
