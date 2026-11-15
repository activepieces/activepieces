import {
  isNil,
  RequiredActionsMissingErrorParams,
  tryCatch,
  unique,
} from '@activepieces/core-utils';
import { PieceMetadataModel } from '@activepieces/pieces-framework';
import {
  FlowActionType,
  FlowOperationType,
  FlowVersion,
  RequiredActionsCheckResult,
  RequiredActionsMode,
  requiredActionsUtil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  BuilderState,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { getLastLocationAsPasteLocation } from '@/app/builder/flow-canvas/utils/bulk-actions';
import { flowCanvasUtils } from '@/app/builder/flow-canvas/utils/flow-canvas-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  pieceSetQueryOptions,
  RequiredActionGroupHeader,
} from '@/features/piece-sets';
import { pieceQueryOptions, stepUtils } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

export function useRequiredActionsCheck() {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectCollectionUtils.useCurrentProject();

  const checkRequiredActions = async (
    flowVersion: FlowVersion,
  ): Promise<FailedRequiredActionsCheck | null> => {
    if (!platform.plan.managePiecesEnabled) {
      return null;
    }
    const { data } = await tryCatch(() =>
      loadAndCheckRequiredActions({
        queryClient,
        projectId: project.id,
        language: i18n.language,
        flowVersion,
      }),
    );
    return data ?? null;
  };

  const explainServerRejection = async (
    params: RequiredActionsMissingErrorParams['params'],
  ): Promise<FailedRequiredActionsCheck> => {
    const result = toCheckResult(params);
    const pieceNames = unique([
      ...Object.keys(result.missingActions),
      ...Object.keys(result.skippedActions),
    ]);
    const piecesByName = await loadPiecesByName({
      queryClient,
      pieceNames,
      language: i18n.language,
    });
    return { result, piecesByName };
  };

  return { checkRequiredActions, explainServerRejection };
}

export function RequiredActionsDialog({
  failedCheck,
  onClose,
}: {
  failedCheck: FailedRequiredActionsCheck | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={failedCheck !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        {failedCheck && (
          <RequiredActionsDialogContent
            failedCheck={failedCheck}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RequiredActionsDialogContent({
  failedCheck,
  onClose,
}: {
  failedCheck: FailedRequiredActionsCheck;
  onClose: () => void;
}) {
  const { result, piecesByName } = failedCheck;
  const { fitView } = useReactFlow();
  const [flowVersion, handleAddingOrUpdatingStep] = useBuilderStateContext(
    (state) => [state.flowVersion, state.handleAddingOrUpdatingStep],
  );
  const areAllActionsRequired = result.mode === RequiredActionsMode.ALL;
  const missingRequiredActionsGroupedByPiece = buildMissingRequiredActionGroups(
    {
      result,
      piecesByName,
    },
  );
  const missingRequiredActions = missingRequiredActionsGroupedByPiece.flatMap(
    (group) => group.actions,
  );
  const [requiredActionsToAdd, setRequiredActionsToAdd] = useState<
    Record<string, string[]>
  >(() =>
    groupByPiece(
      areAllActionsRequired
        ? missingRequiredActions
        : missingRequiredActions.slice(0, 1),
    ),
  );
  const missingRequiredActionsToAdd = missingRequiredActions.filter((action) =>
    willBeAdded({ requiredActionsToAdd, action }),
  );

  const toggleRequiredActionToAdd = (action: MissingRequiredAction) =>
    setRequiredActionsToAdd((prev) =>
      toggleRequiredAction({ requiredActionsToAdd: prev, action }),
    );

  const [showNoActionError, setShowNoActionError] = useState(false);

  const addSteps = () => {
    if (missingRequiredActionsToAdd.length === 0) {
      setShowNoActionError(true);
      return;
    }
    const addedStepNames = addRequiredSteps({
      requiredActions: missingRequiredActionsToAdd,
      piecesByName,
      firstParentStepName:
        getLastLocationAsPasteLocation(flowVersion).parentStepName,
      addStep: handleAddingOrUpdatingStep,
    });
    const firstAddedStepName = addedStepNames[0];
    if (firstAddedStepName) {
      setTimeout(() =>
        fitView(
          flowCanvasUtils.createFocusStepInGraphParams(firstAddedStepName),
        ),
      );
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {areAllActionsRequired
            ? t('Add required actions')
            : t('Add a required action')}
        </DialogTitle>
        <DialogDescription>
          {areAllActionsRequired
            ? t('You must include these actions to publish.')
            : t('You must include one of these actions to publish.')}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea viewPortClassName="max-h-96">
        <div className="flex flex-col gap-3">
          {missingRequiredActionsGroupedByPiece.map((group) => (
            <div key={group.pieceName} className="flex flex-col">
              <RequiredActionGroupHeader
                displayName={group.displayName}
                logoUrl={group.logoUrl}
              />
              {group.actions.map((action) =>
                areAllActionsRequired ? (
                  <RequiredActionRow key={action.actionName} action={action} />
                ) : (
                  <SelectableRequiredActionRow
                    key={action.actionName}
                    action={action}
                    checked={willBeAdded({ requiredActionsToAdd, action })}
                    onToggle={() => toggleRequiredActionToAdd(action)}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      {showNoActionError && missingRequiredActionsToAdd.length === 0 && (
        <p className="text-sm font-medium text-danger-11">
          {t('Select at least one action to add.')}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button type="button" onClick={addSteps}>
          {t('addActionsCount', { count: missingRequiredActionsToAdd.length })}
        </Button>
      </DialogFooter>
    </>
  );
}

async function loadAndCheckRequiredActions({
  queryClient,
  projectId,
  language,
  flowVersion,
}: {
  queryClient: QueryClient;
  projectId: string;
  language: string;
  flowVersion: FlowVersion;
}): Promise<FailedRequiredActionsCheck | null> {
  const pieceSet = await queryClient.fetchQuery(
    pieceSetQueryOptions.project(projectId),
  );
  const { requiredActions } = pieceSet.config;
  const pieceNames = Object.keys(requiredActions.actions);
  if (pieceNames.length === 0) {
    return null;
  }
  const piecesByName = await loadPiecesByName({
    queryClient,
    pieceNames,
    language,
  });
  const actionExists = buildActionExistence({
    requiredActions: requiredActions.actions,
    piecesByName,
  });
  const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({
    requiredActions,
    flowVersion,
    actionExists,
  });
  return result.passed ? null : { result, piecesByName };
}

async function loadPiecesByName({
  queryClient,
  pieceNames,
  language,
}: {
  queryClient: QueryClient;
  pieceNames: string[];
  language: string;
}): Promise<Map<string, PieceMetadataModel>> {
  const loadedPieces = await Promise.all(
    pieceNames.map((name) => loadLatestPiece({ queryClient, name, language })),
  );
  const pieces = loadedPieces.filter((piece) => !isNil(piece));
  return new Map(pieces.map((piece) => [piece.name, piece]));
}

function toCheckResult(
  params: RequiredActionsMissingErrorParams['params'],
): RequiredActionsCheckResult {
  const mode =
    params.mode === RequiredActionsMode.ALL
      ? RequiredActionsMode.ALL
      : RequiredActionsMode.ANY;
  return {
    passed: false,
    mode,
    requiredActions: params.requiredActions,
    missingActions: params.missingActions,
    skippedActions: params.skippedActions,
  };
}

async function loadLatestPiece({
  queryClient,
  name,
  language,
}: {
  queryClient: QueryClient;
  name: string;
  language: string;
}): Promise<PieceMetadataModel | undefined> {
  const { data } = await tryCatch(() =>
    queryClient.ensureQueryData(pieceQueryOptions.latest({ name, language })),
  );
  return data ?? undefined;
}

function buildActionExistence({
  requiredActions,
  piecesByName,
}: {
  requiredActions: Record<string, string[]>;
  piecesByName: Map<string, PieceMetadataModel>;
}): Record<string, Record<string, boolean>> {
  const existencePerPiece = Object.entries(requiredActions).map(
    ([pieceName, actionNames]) => {
      const piece = piecesByName.get(pieceName);
      const existencePerAction = actionNames.map((actionName) => [
        actionName,
        !isNil(piece?.actions[actionName]),
      ]);
      return [pieceName, Object.fromEntries(existencePerAction)];
    },
  );
  return Object.fromEntries(existencePerPiece);
}

function RequiredActionRow({ action }: { action: MissingRequiredAction }) {
  return (
    <div className="flex min-h-10 items-center gap-3 py-1.5 pl-9">
      <RequiredActionName action={action} />
    </div>
  );
}

function SelectableRequiredActionRow({
  action,
  checked,
  onToggle,
}: {
  action: MissingRequiredAction;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 py-1.5 pl-1">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <RequiredActionName action={action} className="pl-2" />
    </label>
  );
}

function RequiredActionName({
  action,
  className,
}: {
  action: MissingRequiredAction;
  className?: string;
}) {
  return (
    <>
      <span className={cn('flex-1 text-sm', className)}>
        {action.displayName}
      </span>
      {action.skipped && (
        <Badge variant="outline" className="shrink-0">
          {t('Skipped')}
        </Badge>
      )}
    </>
  );
}

function buildMissingRequiredActionGroups({
  result,
  piecesByName,
}: {
  result: RequiredActionsCheckResult;
  piecesByName: Map<string, PieceMetadataModel>;
}): MissingRequiredActionGroup[] {
  const pieceNames = unique([
    ...Object.keys(result.missingActions),
    ...Object.keys(result.skippedActions),
  ]);
  return pieceNames.map((pieceName) => {
    const piece = piecesByName.get(pieceName);
    const skippedActionNames = result.skippedActions[pieceName] ?? [];
    const actionNames = [
      ...(result.missingActions[pieceName] ?? []),
      ...skippedActionNames,
    ];
    return {
      pieceName,
      displayName: piece?.displayName ?? pieceName,
      logoUrl: piece?.logoUrl,
      actions: actionNames.map((actionName) => ({
        pieceName,
        actionName,
        displayName: piece?.actions[actionName]?.displayName ?? actionName,
        skipped: skippedActionNames.includes(actionName),
      })),
    };
  });
}

function groupByPiece(
  actions: MissingRequiredAction[],
): Record<string, string[]> {
  return actions.reduce<Record<string, string[]>>(
    (actionsByPiece, action) => ({
      ...actionsByPiece,
      [action.pieceName]: [
        ...(actionsByPiece[action.pieceName] ?? []),
        action.actionName,
      ],
    }),
    {},
  );
}

function willBeAdded({
  requiredActionsToAdd,
  action,
}: {
  requiredActionsToAdd: Record<string, string[]>;
  action: MissingRequiredAction;
}): boolean {
  return (
    requiredActionsToAdd[action.pieceName]?.includes(action.actionName) ?? false
  );
}

function toggleRequiredAction({
  requiredActionsToAdd,
  action,
}: {
  requiredActionsToAdd: Record<string, string[]>;
  action: MissingRequiredAction;
}): Record<string, string[]> {
  const actionNamesInPiece = requiredActionsToAdd[action.pieceName] ?? [];
  if (!willBeAdded({ requiredActionsToAdd, action })) {
    return {
      ...requiredActionsToAdd,
      [action.pieceName]: [...actionNamesInPiece, action.actionName],
    };
  }
  return {
    ...requiredActionsToAdd,
    [action.pieceName]: actionNamesInPiece.filter(
      (actionName) => actionName !== action.actionName,
    ),
  };
}

function addRequiredSteps({
  requiredActions,
  piecesByName,
  firstParentStepName,
  addStep,
}: {
  requiredActions: MissingRequiredAction[];
  piecesByName: Map<string, PieceMetadataModel>;
  firstParentStepName: string;
  addStep: BuilderState['handleAddingOrUpdatingStep'];
}): string[] {
  const addedStepNames: string[] = [];
  for (const requiredAction of requiredActions) {
    const piece = piecesByName.get(requiredAction.pieceName);
    const action = piece?.actions[requiredAction.actionName];
    if (!piece || !action) {
      continue;
    }
    const stepName = addStep({
      pieceSelectorItem: {
        actionOrTrigger: action,
        type: FlowActionType.PIECE,
        pieceMetadata: stepUtils.mapPieceToMetadata({ piece, type: 'action' }),
      },
      operation: {
        type: FlowOperationType.ADD_ACTION,
        actionLocation: {
          parentStep: addedStepNames.at(-1) ?? firstParentStepName,
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        },
      },
      selectStepAfter: addedStepNames.length === 0,
    });
    addedStepNames.push(stepName);
  }
  return addedStepNames;
}

export type FailedRequiredActionsCheck = {
  result: RequiredActionsCheckResult;
  piecesByName: Map<string, PieceMetadataModel>;
};

type MissingRequiredAction = {
  pieceName: string;
  actionName: string;
  displayName: string;
  skipped: boolean;
};

type MissingRequiredActionGroup = {
  pieceName: string;
  displayName: string;
  logoUrl: string | undefined;
  actions: MissingRequiredAction[];
};
