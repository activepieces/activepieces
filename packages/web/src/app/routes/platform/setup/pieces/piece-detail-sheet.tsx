import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceType } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import * as React from 'react';

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
import { PieceIcon } from '@/features/pieces';

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
          <Button
            variant="outline"
            size="sm"
            disabled={!actions.isEnabled}
            onClick={actions.onTogglePin}
          >
            {actions.pinned ? <PinOff /> : <Pin />}
            {actions.pinned ? t('Unpin') : t('Pin to step picker')}
          </Button>
          {actions.oauthStatus !== 'none' && (
            <Button
              variant="outline"
              size="sm"
              disabled={!actions.isEnabled}
              onClick={actions.onConfigureOAuth}
            >
              <Pencil />
              {t('Configure OAuth app')}
            </Button>
          )}
          {actions.oauthStatus === 'configured' && (
            <Button
              variant="outline"
              size="sm"
              disabled={!actions.isEnabled}
              onClick={actions.onRemoveOAuth}
            >
              <Trash2 />
              {t('Remove OAuth app')}
            </Button>
          )}
        </div>
        <dl className="flex flex-col rounded-2xl bg-panel px-4 shadow-edge">
          <Fact label={t('Version')}>{piece.version}</Fact>
          <Fact label={t('Type')}>
            {isCustom ? t('Custom') : t('Official')}
          </Fact>
          <Fact label={t('Actions')}>{piece.actions}</Fact>
          <Fact label={t('Triggers')}>{piece.triggers}</Fact>
          <Fact label={t('Projects')}>{piece.projectUsage}</Fact>
          <Fact label={t('OAuth app')}>
            <OAuthStatusCell status={actions.oauthStatus} />
          </Fact>
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
          <Button
            variant="outline"
            className="w-full text-danger-11 hover:text-danger-11"
            disabled={!actions.isEnabled}
            onClick={actions.onDelete}
          >
            <Trash2 />
            {t('Delete piece')}
          </Button>
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

export function OAuthStatusCell({ status }: { status: OAuthStatus }) {
  switch (status) {
    case 'configured':
      return <StatusDot tone="success">{t('Configured')}</StatusDot>;
    case 'default':
      return <span className="text-gray-11">{t('Default app')}</span>;
    case 'missing':
      return <span className="text-gray-11">{t('Not set')}</span>;
    case 'none':
      return <span className="text-gray-11">—</span>;
  }
}

export type OAuthStatus = 'configured' | 'default' | 'missing' | 'none';

export type PieceRowActions = {
  pinned: boolean;
  oauthStatus: OAuthStatus;
  isEnabled: boolean;
  onTogglePin: () => void;
  onConfigureOAuth: () => void;
  onRemoveOAuth: () => void;
  onDelete: () => void;
};
