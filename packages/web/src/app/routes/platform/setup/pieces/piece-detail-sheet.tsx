import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceType } from '@activepieces/shared';
import {
  Delete02Icon,
  Key01Icon,
  PinIcon,
  PinOffIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import * as React from 'react';

import { Fact, FactList } from '@/components/custom/fact-list';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { EMPTY_VALUE, MutedCell } from '@/components/custom/list/list-cells';
import { StatusDot } from '@/components/custom/status-dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
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
import { PlanLockedPanel, PLATFORM_FEATURES } from '@/features/billing';
import { PieceIcon } from '@/features/pieces';
import { AdminControl, adminControl } from '@/lib/admin-control';

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
  const manageButtons = (
    <div className="flex flex-wrap gap-2">
      <ManageButton
        control={AdminControl.PIECES_PIN_RUN}
        onClick={actions.onTogglePin}
      >
        {actions.pinned ? (
          <HugeiconsIcon icon={PinOffIcon} />
        ) : (
          <HugeiconsIcon icon={PinIcon} />
        )}
        {actions.pinned ? t('Unpin from piece menu') : t('Pin to piece menu')}
      </ManageButton>
      {actions.oauthStatus !== 'none' && (
        <ManageButton
          control={AdminControl.PIECES_OAUTH_CONFIGURE_OPEN}
          onClick={actions.onConfigureOAuth}
        >
          <HugeiconsIcon icon={Key01Icon} />
          {actions.oauthStatus === 'configured'
            ? t('Change OAuth app')
            : t('Set up OAuth app')}
        </ManageButton>
      )}
      {actions.oauthStatus === 'configured' && (
        <ManageButton
          control={AdminControl.PIECES_OAUTH_DELETE_OPEN}
          onClick={actions.onRemoveOAuth}
        >
          <HugeiconsIcon icon={Delete02Icon} />
          {t('Remove OAuth app')}
        </ManageButton>
      )}
    </div>
  );
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
            <TextWithTooltip tooltipMessage={piece.displayName}>
              <SheetTitle className="truncate">{piece.displayName}</SheetTitle>
            </TextWithTooltip>
            <Badge variant="outline">
              {isCustom ? t('Custom') : t('Official')}
            </Badge>
          </div>
          <SheetDescription className="truncate">{piece.name}</SheetDescription>
        </div>
      </SheetHeader>
      <SheetBody>
        {actions.isEnabled ? (
          manageButtons
        ) : (
          <PlanLockedPanel
            feature={PLATFORM_FEATURES.pieces}
            locked
            whenLocked="preview"
            title={t('Manage this piece')}
          >
            {manageButtons}
          </PlanLockedPanel>
        )}
        <FactList>
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
            <Fact label={t('Description')} stacked>
              <span className="font-normal">{piece.description}</span>
            </Fact>
          )}
        </FactList>
      </SheetBody>
      {isCustom && actions.isEnabled && (
        <SheetFooter>
          <ManageButton
            control={AdminControl.PIECES_DELETE_OPEN}
            className="w-full text-danger-11 hover:text-danger-11"
            size="default"
            onClick={actions.onDelete}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            {t('Delete piece')}
          </ManageButton>
        </SheetFooter>
      )}
    </>
  );
}

function ManageButton({
  control,
  onClick,
  className,
  size = 'sm',
  children,
}: {
  control?: AdminControl;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'default';
  children: React.ReactNode;
}) {
  return (
    <Button
      {...adminControl(control)}
      variant="outline"
      size={size}
      className={className}
      onClick={onClick}
    >
      {children}
    </Button>
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
  onTogglePin: () => void;
  onConfigureOAuth: () => void;
  onRemoveOAuth: () => void;
  onDelete: () => void;
};
