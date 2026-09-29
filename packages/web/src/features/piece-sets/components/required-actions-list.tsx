import { PieceMetadataModel } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { ReactNode, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon, piecesHooks } from '@/features/pieces';

export function useRequiredActionGroups({
  actions,
}: {
  actions: Record<string, string[]>;
}) {
  const pieceNames = useMemo(() => Object.keys(actions), [actions]);
  const pieceQueries = piecesHooks.useMultiplePieces({ names: pieceNames });
  const isLoading = pieceQueries.some((query) => query.isLoading);

  const groups = useMemo(
    () =>
      pieceNames.map((pieceName, index) =>
        toAdminRequiredActionGroup({
          pieceName,
          piece: pieceQueries[index]?.data,
          actionNames: actions[pieceName],
          isPieceLoading: isLoading,
        }),
      ),
    [actions, pieceNames, pieceQueries, isLoading],
  );

  return { groups, isLoading };
}

export function RequiredActionGroupHeader({
  displayName,
  logoUrl,
  children,
}: {
  displayName: string;
  logoUrl: string | undefined;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <PieceIcon
        size="sm"
        border={true}
        displayName={displayName}
        logoUrl={logoUrl}
        showTooltip={false}
      />
      <span className="flex-1 text-sm font-semibold">{displayName}</span>
      {children}
    </div>
  );
}

export function RequiredActionsList({
  groups,
  onRemove,
}: {
  groups: RequiredActionGroup[];
  onRemove?: (params: { pieceName: string; actionNames: string[] }) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.pieceName} className="flex flex-col">
          <RequiredActionGroupHeader
            displayName={group.displayName}
            logoUrl={group.logoUrl}
          >
            {onRemove && group.actions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-foreground hover:text-foreground"
                onClick={() =>
                  onRemove({
                    pieceName: group.pieceName,
                    actionNames: group.actions.map((action) => action.name),
                  })
                }
              >
                {t('Remove actions')}
              </Button>
            )}
          </RequiredActionGroupHeader>
          {group.actions.map((action) => (
            <div
              key={action.name}
              className="flex items-center gap-2 py-1.5 pl-9"
            >
              <p className="flex-1 text-sm">{action.displayName}</p>
              {onRemove && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto shrink-0"
                      aria-label={t('Remove')}
                      onClick={() =>
                        onRemove({
                          pieceName: group.pieceName,
                          actionNames: [action.name],
                        })
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Remove')}</TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function toRequiredActionGroup({
  pieceName,
  piece,
  actionNames,
}: {
  pieceName: string;
  piece: PieceMetadataModel | undefined;
  actionNames: string[];
}): RequiredActionGroup {
  const actions = actionNames.map((actionName) => ({
    name: actionName,
    displayName: piece?.actions[actionName]?.displayName ?? actionName,
  }));
  return {
    pieceName,
    displayName: piece?.displayName ?? pieceName,
    logoUrl: piece?.logoUrl,
    actions,
  };
}

function toAdminRequiredActionGroup({
  pieceName,
  piece,
  actionNames,
  isPieceLoading,
}: {
  pieceName: string;
  piece: PieceMetadataModel | undefined;
  actionNames: string[];
  isPieceLoading: boolean;
}): AdminRequiredActionGroup {
  const group = toRequiredActionGroup({ pieceName, piece, actionNames });
  const actions = group.actions.map((action) => ({
    ...action,
    notInLatestPieceVersion: !isPieceLoading && !piece?.actions[action.name],
  }));
  return { ...group, actions };
}

export type RequiredActionRow = {
  name: string;
  displayName: string;
};

export type RequiredActionGroup<
  TRow extends RequiredActionRow = RequiredActionRow,
> = {
  pieceName: string;
  displayName: string;
  logoUrl: string | undefined;
  actions: TRow[];
};

export type AdminRequiredActionRow = RequiredActionRow & {
  notInLatestPieceVersion: boolean;
};

export type AdminRequiredActionGroup =
  RequiredActionGroup<AdminRequiredActionRow>;
