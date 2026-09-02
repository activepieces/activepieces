import type { ActionClassification } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { memo, useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PieceIcon } from '@/features/pieces';
import { ACTION_CLASSIFICATION_BADGES } from '@/features/pieces/utils/action-classification';
import { cn } from '@/lib/utils';

import { ActionGroup, ReachablePiece } from './pieces-utils';

export const PieceRow = memo(function PieceRow({
  row,
  isLastRow,
}: PieceRowProps) {
  const [isOpenedByUser, setIsOpenedByUser] = useState(false);
  const isOpen = row.forceExpanded || isOpenedByUser;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpenedByUser}
      className={cn({ 'border-b': !isLastRow })}
    >
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
        <PieceIcon
          logoUrl={row.piece.logoUrl}
          displayName={row.piece.displayName}
          showTooltip={false}
          size="sm"
          border={true}
        />
        <div className="flex min-w-0 flex-col">
          <TextWithTooltip tooltipMessage={row.piece.displayName}>
            <div className="text-sm font-medium">{row.piece.displayName}</div>
          </TextWithTooltip>
          <TextWithTooltip tooltipMessage={row.piece.description}>
            <div className="text-xs text-muted-foreground">
              {row.piece.description}
            </div>
          </TextWithTooltip>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {row.destructiveActionCount > 0 && (
            <Badge variant="destructive" className="py-0 text-xss font-normal">
              {t('pieceDestructiveActionCount', {
                count: row.destructiveActionCount,
              })}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {t('pieceActionCount', {
              count: row.actionCount,
            })}
          </span>
          <ChevronDown
            className={cn('size-4 text-muted-foreground transition-transform', {
              'rotate-180': isOpen,
            })}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-7 border-t bg-muted/60 pt-4 pr-5 pb-5 pl-2 sm:grid-cols-2 lg:grid-cols-4 lg:pl-12.5">
          {row.groups.map((group) => (
            <ActionGroupColumn
              key={group.classification}
              group={group}
              pieceDisplayName={row.piece.displayName}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

function ActionGroupColumn({
  group,
  pieceDisplayName,
}: ActionGroupColumnProps) {
  const tone = CLASSIFICATION_TONES[group.classification];

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2 px-2">
        <span
          className={cn(
            'text-xs font-semibold tracking-wider uppercase',
            tone.label,
          )}
        >
          {ACTION_CLASSIFICATION_BADGES[group.classification].label()}
        </span>
        <Badge variant={tone.count} className="px-1.5 text-xss">
          {group.actions.length}
        </Badge>
      </div>
      <div className={cn('flex min-w-0 flex-col', tone.frame)}>
        {group.actions.map((action) => (
          <TextWithTooltip
            key={action.name}
            tooltipMessage={action.displayName}
          >
            <div className="rounded-sm px-2 py-0.5 text-sm leading-5 hover:bg-muted">
              {action.displayName}
            </div>
          </TextWithTooltip>
        ))}
        {group.classification === 'DESTRUCTIVE' && (
          <p className="px-2 pt-1.5 text-xs text-destructive-700 dark:text-destructive-300">
            {t('Can delete or overwrite data in {pieceName}.', {
              pieceName: pieceDisplayName,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

const CLASSIFICATION_TONES: Record<ActionClassification, ClassificationTone> = {
  READ: { label: 'text-foreground', count: 'accent' },
  SEARCH: { label: 'text-foreground', count: 'accent' },
  WRITE: {
    label: 'text-warning-700 dark:text-warning-300',
    count: 'warning',
  },
  DESTRUCTIVE: {
    label: 'text-destructive-700 dark:text-destructive-300',
    count: 'destructive',
    frame:
      'gap-0.5 rounded-md border border-destructive-200 bg-destructive-50 py-1.5 dark:border-destructive-900 dark:bg-destructive-950/30',
  },
};

type ClassificationTone = {
  label: string;
  count: 'accent' | 'warning' | 'destructive';
  frame?: string;
};

type ActionGroupColumnProps = {
  group: ActionGroup;
  pieceDisplayName: string;
};

type PieceRowProps = {
  row: ReachablePiece;
  isLastRow: boolean;
};
