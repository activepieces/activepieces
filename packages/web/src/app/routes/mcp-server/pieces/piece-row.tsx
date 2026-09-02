import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

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

import { ReachablePiece } from './pieces-utils';

export function PieceRow({ row }: { row: ReachablePiece }) {
  const [isOpenedByUser, setIsOpenedByUser] = useState(false);
  const isOpen = row.forceExpanded || isOpenedByUser;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpenedByUser}
      className="border-b last:border-b-0"
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
        <div className="grid grid-cols-1 gap-6 bg-muted/40 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {row.groups.map((group) => (
            <div key={group.classification} className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-xss font-semibold uppercase tracking-wide',
                    group.classification === 'DESTRUCTIVE'
                      ? 'text-destructive'
                      : 'text-muted-foreground',
                  )}
                >
                  {ACTION_CLASSIFICATION_BADGES[group.classification].label()}
                </span>
                <span className="text-xss text-muted-foreground">
                  {group.actions.length}
                </span>
              </div>
              {group.actions.map((action) => (
                <TextWithTooltip
                  key={action.name}
                  tooltipMessage={action.displayName}
                >
                  <div className="text-sm">{action.displayName}</div>
                </TextWithTooltip>
              ))}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
