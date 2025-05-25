import React, { useState, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import {
  PieceTagEnum,
  PieceTagGroup,
} from '@/app/builder/pieces-selector/piece-tag-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  StepMetadata,
  PieceSelectorOperation,
  HandleSelectCallback,
  StepMetadataWithSuggestions,
  PieceSelectorItem,
  PieceStepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { platformHooks } from '@/hooks/platform-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Action,
  ActionType,
  BranchExecutionType,
  BranchOperator,
  flowOperations,
  FlowOperationType,
  flowStructureUtil,
  isNil,
  RouterExecutionType,
  StepLocationRelativeToParent,
  TodoType,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { SearchInput } from '../../../components/ui/search-input';

import { AskAiButton } from './ask-ai';
import { PiecesCardList } from './pieces-card-list';
import { StepsCardList } from './steps-card-list';

type PieceSelectorProps = {
  children: React.ReactNode;
  open: boolean;
  asChild?: boolean;
  initialSelectedPiece?: string | undefined;
  onOpenChange: (open: boolean) => void;
} & { operation: PieceSelectorOperation };

type PieceGroup = {
  title: string;
  pieces: StepMetadataWithSuggestions[];
};

const hiddenActionsOrTriggers = ['createTodoAndWait', 'wait_for_approval'];

const PieceSelector = ({
  children,
  open,
  asChild = true,
  onOpenChange,
  operation,
  initialSelectedPiece,
}: PieceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedPieceMetadata, setSelectedMetadata] = useState<
    StepMetadata | undefined
  >(undefined);

  const initiallySelectedMetaDataRef = useRef<StepMetadata | undefined>(
    undefined,
  );

  const [selectedTag, setSelectedTag] = useState<PieceTagEnum>(
    PieceTagEnum.ALL,
  );
  const [applyOperation, selectStepByName, flowVersion, setAskAiButtonProps] =
    useBuilderStateContext((state) => [
      state.applyOperation,
      state.selectStepByName,
      state.flowVersion,
      state.setAskAiButtonProps,
    ]);

  const isTrigger = operation.type === FlowOperationType.UPDATE_TRIGGER;
  const { metadata, isLoading: isLoadingPieces } =
    piecesHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: isTrigger ? 'trigger' : 'action',
    });

  const { platform } = platformHooks.useCurrentPlatform();

  const pieceGroups = useMemo(() => {
    if (!metadata) return [];

    const filteredMetadataOnTag = metadata.filter((stepMetadata) => {
      switch (selectedTag) {
        case PieceTagEnum.CORE:
          return pieceSelectorUtils.isCorePiece(stepMetadata);
        case PieceTagEnum.AI:
          return pieceSelectorUtils.isAiPiece(stepMetadata);
        case PieceTagEnum.APPS:
          return pieceSelectorUtils.isAppPiece(stepMetadata);
        case PieceTagEnum.ALL:
        default:
          return true;
      }
    });

    const piecesMetadata =
      debouncedQuery.length > 0
        ? filterOutPiecesWithNoSuggestions(filteredMetadataOnTag)
        : filteredMetadataOnTag;

    initiallySelectedMetaDataRef.current = piecesMetadata.find(
      (p) => p.displayName === initialSelectedPiece,
    );
    setSelectedMetadata(initiallySelectedMetaDataRef.current);

    if (debouncedQuery.length > 0 && piecesMetadata.length > 0) {
      return [{ title: 'Search Results', pieces: piecesMetadata }];
    }

    const flowControllerPieces = piecesMetadata.filter(
      (p) => pieceSelectorUtils.isFlowController(p) && !isTrigger,
    );
    const universalAiPieces = piecesMetadata.filter(
      (p) => pieceSelectorUtils.isUniversalAiPiece(p) && !isTrigger,
    );
    const utilityCorePieces = piecesMetadata.filter(
      (p) => pieceSelectorUtils.isUtilityCorePiece(p, platform) && !isTrigger,
    );
    const popularPieces = piecesMetadata.filter(
      (p) =>
        pieceSelectorUtils.isPopularPieces(p, platform) &&
        selectedTag !== PieceTagEnum.AI,
    );
    const other = piecesMetadata.filter(
      (p) =>
        !popularPieces.includes(p) &&
        !utilityCorePieces.includes(p) &&
        !flowControllerPieces.includes(p) &&
        !universalAiPieces.includes(p),
    );

    const groups: PieceGroup[] = [
      { title: 'Popular', pieces: popularPieces },
      { title: 'Flow Control', pieces: flowControllerPieces },
      { title: 'Utility', pieces: utilityCorePieces },
      { title: 'Universal AI', pieces: universalAiPieces },
      { title: 'Other', pieces: other },
    ];

    return groups.filter((group) => group.pieces.length > 0);
  }, [
    metadata,
    selectedTag,
    debouncedQuery,
    platform,
    isTrigger,
    initialSelectedPiece,
  ]);

  const piecesIsLoaded = !isLoadingPieces && pieceGroups.length > 0;
  const noResultsFound = !isLoadingPieces && pieceGroups.length === 0;

  const {
    listHeightRef,
    popoverTriggerRef,
    aboveListSectionHeight,
    maxListHeight,
  } = pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace(open);

  const resetField = () => {
    setSearchQuery('');
    setSelectedMetadata(initiallySelectedMetaDataRef.current);
    setSelectedTag(PieceTagEnum.ALL);
  };

  const handleAddAction = (
    stepName: string,
    stepMetadata: StepMetadata,
    parentStep: Action | Trigger,
    actionOrTrigger: PieceSelectorItem,
    settings?: Record<string, unknown>,
    valid?: boolean,
  ) => {
    const stepData = pieceSelectorUtils.getDefaultStep({
      stepName: stepName,
      stepMetadata,
      actionOrTrigger,
      settings: settings,
    });

    applyOperation({
      type: FlowOperationType.ADD_ACTION,
      request: {
        parentStep: parentStep.name,
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        action: {
          ...stepData,
          valid: valid ?? stepData.valid,
        } as Action,
      },
    });
  };

  const handleAddCreateTodoAction = (
    stepMetadata: StepMetadata,
    actionOrTrigger: PieceSelectorItem,
    type?: string,
  ) => {
    if (operation.type !== FlowOperationType.ADD_ACTION) {
      return;
    }
    const routerAction = {
      name: 'router',
      displayName: 'Check Todo Status',
      description: 'Split your flow into branches depending on todo status',
      type: ActionType.ROUTER,
    } as PieceSelectorItem;

    const routerStepMetadata = {
      displayName: 'Check Todo Status',
      logoUrl: stepMetadata.logoUrl,
      description: 'Split your flow into branches depending on todo status',
      type: ActionType.ROUTER,
    } as StepMetadata;

    const newStepNames = pieceSelectorUtils.getStepNames(
      stepMetadata,
      flowVersion,
      3,
    );

    const stepData = pieceSelectorUtils.getDefaultStep({
      stepName: newStepNames[0],
      stepMetadata,
      actionOrTrigger,
    });

    applyOperation({
      type: FlowOperationType.ADD_ACTION,
      request: {
        ...operation.actionLocation,
        action: stepData as Action,
      },
    });
    flowOperations.apply(flowVersion, {
      type: FlowOperationType.ADD_ACTION,
      request: {
        ...operation.actionLocation,
        action: stepData as Action,
      },
    });
    selectStepByName(stepData.name);

    switch (type) {
      case TodoType.INTERNAL: {
        const routerInternalSettings = {
          branches: [
            {
              conditions: [
                [
                  {
                    operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                    firstValue: `{{ ${stepData.name}['status'] }}`,
                    secondValue: 'Accepted',
                    caseSensitive: false,
                  },
                ],
              ],
              branchType: BranchExecutionType.CONDITION,
              branchName: 'Accepted',
            },
            {
              branchType: BranchExecutionType.FALLBACK,
              branchName: 'Rejected',
            },
          ],
          executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
          inputUiInfo: {
            customizedInputs: {
              logoUrl: stepMetadata.logoUrl,
              description: routerStepMetadata.description,
            },
          },
        };

        handleAddAction(
          newStepNames[1],
          routerStepMetadata,
          stepData,
          routerAction,
          routerInternalSettings,
          true,
        );
        break;
      }
      case TodoType.EXTERNAL: {
        const waitForApprovalAction = (
          stepMetadata as PieceStepMetadataWithSuggestions
        )?.suggestedActions?.find(
          (action: any) => action.name === 'wait_for_approval',
        ) as PieceSelectorItem;

        const waitForApprovalStepName = newStepNames[1];

        const waitForApprovalStepData = pieceSelectorUtils.getDefaultStep({
          stepName: waitForApprovalStepName,
          stepMetadata,
          actionOrTrigger: waitForApprovalAction,
        });

        const waitForApprovalStepDataSettings = {
          ...waitForApprovalStepData.settings,
          input: {
            ...waitForApprovalStepData.settings.input,
            taskId: `{{ ${stepData.name}['id'] }}`,
          },
        };

        handleAddAction(
          waitForApprovalStepName,
          stepMetadata,
          stepData,
          waitForApprovalAction,
          waitForApprovalStepDataSettings,
          true,
        );

        const routerExternalSettings = {
          branches: [
            {
              conditions: [
                [
                  {
                    operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                    firstValue: `{{ ${waitForApprovalStepData.name}['status'] }}`,
                    secondValue: 'Accepted',
                    caseSensitive: false,
                  },
                ],
              ],
              branchType: BranchExecutionType.CONDITION,
              branchName: 'Accepted',
            },
            {
              branchType: BranchExecutionType.FALLBACK,
              branchName: 'Rejected',
            },
          ],
          executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
          inputUiInfo: {
            customizedInputs: {
              logoUrl: stepMetadata.logoUrl,
              description: routerStepMetadata.description,
            },
          },
        };

        handleAddAction(
          newStepNames[2],
          routerStepMetadata,
          waitForApprovalStepData,
          routerAction,
          routerExternalSettings,
          true,
        );
        break;
      }
    }
  };

  const handleAddAgentAction = (
    stepMetadata: StepMetadata,
    actionOrTrigger: PieceSelectorItem,
  ) => {
    if (operation.type !== FlowOperationType.ADD_ACTION) {
      return;
    }

    const newStepName = pieceSelectorUtils.getStepName(
      stepMetadata,
      flowVersion,
    );

    const stepData = pieceSelectorUtils.getDefaultStep({
      stepName: newStepName,
      stepMetadata,
      actionOrTrigger,
    });

    // Generate random number for the robot icon
    const randomNumber = Math.floor(Math.random() * 10000) + 1;
    const customLogoUrl = `https://cdn.activepieces.com/pieces/ai/robots/robot_${randomNumber}.png`;

    // Set custom logo URL for the agent step
    if (stepData.settings.inputUiInfo?.customizedInputs) {
      stepData.settings.inputUiInfo.customizedInputs.logoUrl = customLogoUrl;
    } else if (stepData.settings.inputUiInfo) {
      stepData.settings.inputUiInfo.customizedInputs = {
        logoUrl: customLogoUrl,
      };
    } else {
      stepData.settings.inputUiInfo = {
        customizedInputs: {
          logoUrl: customLogoUrl,
        },
      };
    }

    applyOperation({
      type: FlowOperationType.ADD_ACTION,
      request: {
        ...operation.actionLocation,
        action: stepData as Action,
      },
    });

    selectStepByName(stepData.name);
  };

  const handleSelect: HandleSelectCallback = async (
    stepMetadata,
    actionOrTrigger,
    type?: string,
  ) => {
    resetField();
    onOpenChange(false);

    const newStepName = pieceSelectorUtils.getStepName(
      stepMetadata,
      flowVersion,
    );

    const stepData = pieceSelectorUtils.getDefaultStep({
      stepName: newStepName,
      stepMetadata,
      actionOrTrigger,
    });

    switch (operation.type) {
      case FlowOperationType.UPDATE_TRIGGER: {
        applyOperation({
          type: FlowOperationType.UPDATE_TRIGGER,
          request: stepData as Trigger,
        });
        selectStepByName('trigger');
        break;
      }
      case FlowOperationType.ADD_ACTION: {
        if (
          stepData.settings.pieceName === '@activepieces/piece-todos' &&
          type
        ) {
          handleAddCreateTodoAction(stepMetadata, actionOrTrigger, type);
          break;
        }
        if (stepData.settings.pieceName === '@activepieces/piece-agent') {
          handleAddAgentAction(stepMetadata, actionOrTrigger);
          break;
        }
        applyOperation({
          type: FlowOperationType.ADD_ACTION,
          request: {
            ...operation.actionLocation,
            action: stepData as Action,
          },
        });
        selectStepByName(stepData.name);
        break;
      }
      case FlowOperationType.UPDATE_ACTION: {
        const currentAction = flowStructureUtil.getStep(
          operation.stepName,
          flowVersion.trigger,
        );
        if (isNil(currentAction)) {
          console.error(
            "Trying to update an action that's not in the displayed flow version",
          );
          return;
        }
        if (
          currentAction.type === TriggerType.EMPTY ||
          currentAction.type === TriggerType.PIECE
        ) {
          console.error(
            "Trying to update an action that's actually the trigger in the displayed flow version",
          );
          return;
        }
        if (
          (currentAction.type !== ActionType.PIECE &&
            stepData.type !== ActionType.PIECE &&
            stepData.type === currentAction.type) ||
          (currentAction.type === ActionType.PIECE &&
            stepData.type === ActionType.PIECE &&
            stepData.settings.actionName === currentAction.settings.actionName)
        ) {
          return;
        }

        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            type: (stepData as Action).type,
            displayName: stepData.displayName,
            name: operation.stepName,
            skip: (stepData as Action).skip,
            settings: {
              ...stepData.settings,
            },
            valid: stepData.valid,
          },
        });
        break;
      }
    }

    setAskAiButtonProps(null);
  };
  const isMobile = useIsMobile();
  return (
    <Popover
      open={open}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          resetField();
          listHeightRef.current = maxListHeight;
        }
        onOpenChange(open);
      }}
    >
      <PopoverTrigger ref={popoverTriggerRef} asChild={asChild}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        onContextMenu={(e) => {
          e.stopPropagation();
        }}
        className="w-[340px] md:w-[600px] p-0 shadow-lg"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <>
          <div
            style={{
              height: `${aboveListSectionHeight}px`,
            }}
          >
            <div className="p-2 flex gap-1 items-center">
              <SearchInput
                placeholder="Search"
                value={searchQuery}
                showDeselect={searchQuery.length > 0}
                onChange={(e) => {
                  setSearchQuery(e);
                  setSelectedTag(PieceTagEnum.ALL);
                  setSelectedMetadata(undefined);
                }}
              />
              {operation.type !== FlowOperationType.UPDATE_TRIGGER && (
                <AskAiButton
                  varitant="ghost"
                  operation={operation}
                  onClick={() => {
                    onOpenChange(false);
                  }}
                ></AskAiButton>
              )}
            </div>

            <PieceTagGroup
              selectedTag={selectedTag}
              type={
                operation.type === FlowOperationType.UPDATE_TRIGGER
                  ? 'trigger'
                  : 'action'
              }
              onSelectTag={(value) => {
                setSelectedTag(value);
                setSelectedMetadata(undefined);
              }}
            />
            <Separator orientation="horizontal" />
          </div>
          {!isMobile && (
            <div
              className=" flex   flex-row overflow-y-auto max-h-[300px] h-[300px] "
              style={{
                height: listHeightRef.current + 'px',
              }}
            >
              <PiecesCardList
                closePieceSelector={() => onOpenChange(false)}
                debouncedQuery={debouncedQuery}
                selectedTag={selectedTag}
                piecesIsLoaded={piecesIsLoaded}
                noResultsFound={noResultsFound}
                selectedPieceMetadata={selectedPieceMetadata}
                setSelectedMetadata={setSelectedMetadata}
                operation={operation}
                handleSelect={handleSelect}
                pieceGroups={pieceGroups}
                isLoadingPieces={isLoadingPieces}
                hiddenActionsOrTriggers={hiddenActionsOrTriggers}
              />

              {debouncedQuery.length === 0 &&
                piecesIsLoaded &&
                !noResultsFound && (
                  <>
                    <Separator orientation="vertical" className="h-full" />
                    <StepsCardList
                      hiddenActionsOrTriggers={hiddenActionsOrTriggers}
                      selectedPieceMetadata={selectedPieceMetadata}
                      handleSelect={handleSelect}
                    />
                  </>
                )}
            </div>
          )}

          {isMobile && (
            <div
              className=" max-h-[300px] h-[300px]"
              style={{
                height: listHeightRef.current + 'px',
              }}
            >
              <PiecesCardList
                closePieceSelector={() => onOpenChange(false)}
                debouncedQuery={debouncedQuery}
                selectedTag={selectedTag}
                piecesIsLoaded={piecesIsLoaded}
                noResultsFound={noResultsFound}
                hiddenActionsOrTriggers={hiddenActionsOrTriggers}
                selectedPieceMetadata={selectedPieceMetadata}
                setSelectedMetadata={setSelectedMetadata}
                operation={operation}
                handleSelect={handleSelect}
                pieceGroups={pieceGroups}
                isLoadingPieces={isLoadingPieces}
              />
            </div>
          )}
        </>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };

function filterOutPiecesWithNoSuggestions(
  metadata: StepMetadataWithSuggestions[],
) {
  return metadata.filter((step) => {
    const isActionWithSuggestions =
      step.type === ActionType.PIECE &&
      step.suggestedActions &&
      step.suggestedActions.length > 0;
    const isTriggerWithSuggestions =
      step.type === TriggerType.PIECE &&
      step.suggestedTriggers &&
      step.suggestedTriggers.length > 0;
    const isNotPieceType =
      step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE;

    return (
      isActionWithSuggestions || isTriggerWithSuggestions || isNotPieceType
    );
  });
}
