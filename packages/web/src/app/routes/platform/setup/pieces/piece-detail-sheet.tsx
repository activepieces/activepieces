import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceType } from '@activepieces/shared';
import { t } from 'i18next';
import { KeyRound, Pin, PinOff, Trash2 } from 'lucide-react';
import * as React from 'react';

import { EMPTY_VALUE, MutedCell } from '@/components/custom/list/list-cells';
import { StatusDot } from '@/components/custom/status-dot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces';
import { cn } from '@/lib/utils';

export const PieceDetailSheet = ({
  piece,
  actions,
  onOpenChange,
}: {
  piece: PieceMetadataModelSummary | null;
  actions: PieceRowActions | null;
  onOpenChange: (open: boolean) => void;
}) => (
  <Sheet open={piece !== null} onOpenChange={onOpenChange}>
    <SheetContent size="sm">
      {piece && actions && (
        <PieceDetailContent piece={piece} actions={actions} />
      )}
    </SheetContent>
  </Sheet>
);

function PieceDetailContent({
  piece,
  actions,
}: {
  piece: PieceMetadataModelSummary;
  actions: PieceRowActions;
}) {
  const isCustom = piece.pieceType === PieceType.CUSTOM;
  return (
    <>
      <SheetHeader className="flex-row items-center gap-3">
        <PieceIcon
          size="md"
          border
          displayName={piece.displayName}
          logoUrl={piece.logoUrl}
          showTooltip={false}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <SheetTitle className="truncate">{piece.displayName}</SheetTitle>
            <Badge variant="outline">
              {isCustom ? t('Custom') : t('Official')}
            </Badge>
          </div>
          <SheetDescription className="truncate">{piece.name}</SheetDescription>
        </div>
      </SheetHeader>
      <SheetBody>
        <div className="flex flex-wrap gap-2">
          <LockableButton
            lockedReason={actions.isEnabled ? null : actions.lockedReason}
            onClick={actions.onTogglePin}
          >
            {actions.pinned ? <PinOff /> : <Pin />}
            {actions.pinned
              ? t('Unpin from step picker')
              : t('Pin to step picker')}
          </LockableButton>
          {actions.oauthStatus !== 'none' && (
            <LockableButton
              lockedReason={actions.isEnabled ? null : actions.lockedReason}
              onClick={actions.onConfigureOAuth}
            >
              <KeyRound />
              {actions.oauthStatus === 'configured'
                ? t('Change OAuth app')
                : t('Set up OAuth app')}
            </LockableButton>
          )}
          {actions.oauthStatus === 'configured' && (
            <LockableButton
              lockedReason={actions.isEnabled ? null : actions.lockedReason}
              onClick={actions.onRemoveOAuth}
            >
              <Trash2 />
              {t('Remove OAuth app')}
            </LockableButton>
          )}
        </div>
        <dl className="flex flex-col rounded-2xl bg-panel px-5 shadow-edge">
          <Fact label={t('Version')}>{piece.version}</Fact>
          <Fact label={t('Type')}>
            {isCustom ? t('Custom') : t('Official')}
          </Fact>
          <Fact label={t('Actions')}>{piece.actions}</Fact>
          <Fact label={t('Triggers')}>{piece.triggers}</Fact>
          <Fact label={t('Projects')}>{piece.projectUsage}</Fact>
          {actions.oauthStatus !== 'none' && (
            <Fact label={t('OAuth app')}>
              <OAuthStatusCell status={actions.oauthStatus} />
            </Fact>
          )}
          {piece.description && (
            <div className="flex flex-col gap-1 border-t border-gray-6 py-3">
              <dt className="text-sm text-gray-11">{t('Description')}</dt>
              <dd className="text-sm text-gray-12">{piece.description}</dd>
            </div>
          )}
        </dl>
      </SheetBody>
      {isCustom && (
        <SheetFooter>
          <LockableButton
            lockedReason={actions.isEnabled ? null : actions.lockedReason}
            className="w-full text-danger-11 hover:text-danger-11"
            size="default"
            onClick={actions.onDelete}
          >
            <Trash2 />
            {t('Delete piece')}
          </LockableButton>
        </SheetFooter>
      )}
    </>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-6 py-3 first:border-t-0">
      <dt className="text-sm text-gray-11">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-12 tabular-nums">
        {children}
      </dd>
    </div>
  );
}

function LockableButton({
  lockedReason,
  onClick,
  className,
  size = 'sm',
  children,
}: {
  lockedReason: string | null;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'default';
  children: React.ReactNode;
}) {
  const button = (
    <Button
      variant="outline"
      size={size}
      className={className}
      disabled={lockedReason !== null}
      onClick={onClick}
    >
      {children}
    </Button>
  );
  if (lockedReason === null) {
    return button;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', className)}>{button}</span>
      </TooltipTrigger>
      <TooltipContent>{lockedReason}</TooltipContent>
    </Tooltip>
  );
}

export function OAuthStatusCell({ status }: { status: OAuthStatus }) {
  switch (status) {
    case 'configured':
      return <StatusDot tone="success">{t('Your app')}</StatusDot>;
    case 'default':
      return <StatusDot tone="neutral">{t('Default')}</StatusDot>;
    case 'missing':
      return <StatusDot tone="warning">{t('Not set up')}</StatusDot>;
    case 'none':
      return <MutedCell>{EMPTY_VALUE}</MutedCell>;
  }
}

export type OAuthStatus = 'configured' | 'default' | 'missing' | 'none';

export type PieceRowActions = {
  pinned: boolean;
  oauthStatus: OAuthStatus;
  isEnabled: boolean;
  lockedReason: string;
  onTogglePin: () => void;
  onConfigureOAuth: () => void;
  onRemoveOAuth: () => void;
  onDelete: () => void;
};
