import { t } from 'i18next';
import { Check, RefreshCw, Repeat, Unlink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PieceIcon } from '@/features/pieces';
import { cn } from '@/lib/utils';

function ConnectedAccountPanel({
  pieceDisplayName,
  logoUrl,
  connectionName,
  statusLabel,
  statusTone,
  scopeLabel,
  disabled,
  onChangeConnection,
  onReconnect,
  onDisconnect,
}: ConnectedAccountPanelProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="relative">
        <PieceIcon
          logoUrl={logoUrl}
          displayName={pieceDisplayName}
          showTooltip={false}
          border={false}
          size="xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-success-600 text-white"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-foreground">
          {t('{piece} connected', { piece: pieceDisplayName })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('This step will run using the connection below.')}
        </p>
      </div>

      <dl className="w-full overflow-hidden rounded-lg border border-border text-left">
        <DetailRow label={t('Connection name')} value={connectionName} />
        <DetailRow
          label={t('Status')}
          value={statusLabel}
          valueClassName={cn(
            statusTone === 'success' && 'text-success-600',
            statusTone === 'destructive' && 'text-destructive',
          )}
          withDot={statusTone}
        />
        <DetailRow label={t('Scope')} value={scopeLabel} isLast />
      </dl>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onChangeConnection}
        >
          <Repeat className="size-4" />
          {t('Change connection')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onReconnect}
        >
          <RefreshCw className="size-4" />
          {t('Reconnect')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onDisconnect}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Unlink className="size-4" />
          {t('Disconnect')}
        </Button>
      </div>
    </div>
  );
}

ConnectedAccountPanel.displayName = 'ConnectedAccountPanel';

function DetailRow({
  label,
  value,
  valueClassName,
  withDot,
  isLast,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-3.5 py-2.5',
        !isLast && 'border-b border-border',
      )}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground',
          valueClassName,
        )}
      >
        {withDot && (
          <span
            aria-hidden
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              withDot === 'success' && 'bg-success-600',
              withDot === 'destructive' && 'bg-destructive',
              withDot === 'muted' && 'bg-muted-foreground',
            )}
          />
        )}
        <span className="truncate">{value}</span>
      </dd>
    </div>
  );
}

export { ConnectedAccountPanel };

export type ConnectionStatusTone = 'success' | 'destructive' | 'muted';

type ConnectedAccountPanelProps = {
  pieceDisplayName: string;
  logoUrl?: string;
  connectionName: string;
  statusLabel: string;
  statusTone: ConnectionStatusTone;
  scopeLabel: string;
  disabled: boolean;
  onChangeConnection: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
  withDot?: ConnectionStatusTone;
  isLast?: boolean;
};
