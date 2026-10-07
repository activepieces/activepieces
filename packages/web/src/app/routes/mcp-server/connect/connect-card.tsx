import { t } from 'i18next';
import { ArrowLeft, ArrowRight, ArrowUpRight, KeyRound } from 'lucide-react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { useMcpNav } from '../mcp-nav';

import { ConnectHome } from './use-connect-home';

export function ConnectCard({
  home,
  serverUrl,
  isReachableFromInternet,
  onBack,
  className,
}: {
  home: ConnectHome;
  serverUrl: string;
  isReachableFromInternet: boolean;
  onBack?: () => void;
  className?: string;
}) {
  const nav = useMcpNav();
  const client = home.selected;
  const [install, authenticate] = client.instructions;
  const action = install.action;
  const isBlocked =
    action?.requiresInternetReachableUrl === true && !isReachableFromInternet;
  const command =
    install.command && install.command !== serverUrl ? install.command : null;

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-6 rounded-xl border bg-panel p-6',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 text-base font-semibold">
          {onBack ? t('Connect another client') : t('Connect your AI')}
        </span>
        {onBack && (
          <Button variant="ghost" size="xs" onClick={onBack}>
            <ArrowLeft />
            {t('Back')}
          </Button>
        )}
      </div>

      <div role="tablist" className="grid grid-cols-5 gap-2">
        {home.available.map((item) => {
          const isSelected = item.key === client.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => home.select(item.key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg px-0.5 pb-1.5 pt-2.5 transition-colors',
                isSelected ? 'bg-gray-3 ring-1 ring-gray-7' : 'hover:bg-gray-3',
              )}
            >
              <ClientIcon icon={item.icon} className="size-8 rounded-lg" />
              <span
                className={cn(
                  'line-clamp-2 h-8 w-full text-center text-xs leading-4',
                  isSelected ? 'font-medium text-gray-12' : 'text-gray-11',
                )}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-col gap-3 border-t pt-6"
        onClickCapture={home.startWatching}
      >
        {action && (
          <Button className="w-full" disabled={isBlocked} asChild={!isBlocked}>
            {isBlocked ? (
              <span>{action.label}</span>
            ) : (
              <a href={action.href} target="_blank" rel="noreferrer">
                {action.label}
                <ArrowUpRight />
              </a>
            )}
          </Button>
        )}
        {isBlocked && (
          <span className="text-xs text-gray-11">
            {t(
              'Your server URL is not reachable from the internet, so this client cannot dial it.',
            )}
          </span>
        )}
        {command && <CopyToClipboardInput textToCopy={command} useInput />}
        <span className="pt-1 text-xs text-gray-11">
          {action || command
            ? t('Or paste the server URL')
            : t('Paste the server URL into {client}', { client: client.name })}
        </span>
        <CopyToClipboardInput textToCopy={serverUrl} useInput />
      </div>

      <div className="mt-auto flex items-end gap-4">
        {authenticate && (
          <p className="flex flex-1 items-start gap-2 text-xs text-gray-11">
            <KeyRound className="mt-px size-3.5 shrink-0" />
            {authenticate.body}
          </p>
        )}
        <Button
          variant="link"
          size="sm"
          className="shrink-0"
          onClick={() => nav.showClient(client.key)}
        >
          {t('Full guide')}
          <ArrowRight />
        </Button>
      </div>
      {home.isWatching && (
        <span className="flex items-center gap-2 text-xs text-gray-11">
          <span className="size-1.5 animate-pulse rounded-full bg-accent-10 motion-reduce:animate-none" />
          {t('Waiting for {client} to sign in. This page updates on its own.', {
            client: client.name,
          })}
        </span>
      )}
    </section>
  );
}
