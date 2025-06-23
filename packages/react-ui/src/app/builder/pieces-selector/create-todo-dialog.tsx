import { t } from 'i18next';
import { useState } from 'react';

import ActivepiecesCreateTodoGuide from '@/assets/img/custom/ActivepiecesCreateTodoGuide.png';
import ActivepiecesTodo from '@/assets/img/custom/ActivepiecesTodo.png';
import ExternalChannelTodo from '@/assets/img/custom/External_Channel_Todo.png';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import {
  CORE_STEP_METADATA,
  TODO_ACTIONS,
} from '@/features/pieces/lib/step-utils';
import {
  PieceSelectorItem,
  PieceSelectorOperation,
  PieceSelectorPieceItem,
  PieceStepMetadataWithSuggestions,
} from '@/lib/types';
import {
  ActionType,
  BranchExecutionType,
  BranchOperator,
  FlowOperationType,
  isNil,
  RouterActionSettings,
  RouterExecutionType,
  StepLocationRelativeToParent,
  TodoType,
} from '@activepieces/shared';

import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import GenericActionOrTriggerItem from './generic-piece-selector-item';

type CreateTodoGuideProps = {
  pieceSelectorItem: PieceSelectorPieceItem;
  operation: PieceSelectorOperation;
  hidePieceIcon: boolean;
};

const getTodoActionName = (todoType: TodoType) => {
  switch (todoType) {
    case TodoType.INTERNAL:
      return TODO_ACTIONS.createTodoAndWait;
    case TodoType.EXTERNAL:
      return TODO_ACTIONS.wait_for_approval;
  }
};

const getActionFromPieceMetadata = (
  pieceMetadata: PieceStepMetadataWithSuggestions,
  actionName: string,
) => {
  const result = pieceMetadata.suggestedActions?.find(
    (action) => action.name === actionName,
  );
  if (isNil(result)) {
    toast(INTERNAL_ERROR_TOAST);
    console.error(`Action ${actionName} not found in piece metadata`);
    return null;
  }
  return result;
};

const createRouterStep = ({
  parentStepName,
  logoUrl,
  handleAddingOrUpdatingStep,
}: {
  parentStepName: string;
  logoUrl: string;
  handleAddingOrUpdatingStep: BuilderState['handleAddingOrUpdatingStep'];
}) => {
  const routerInternalSettings: RouterActionSettings = {
    branches: [
      {
        conditions: [
          [
            {
              operator: BranchOperator.TEXT_EXACTLY_MATCHES,
              firstValue: `{{ ${parentStepName}['status'] }}`,
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
    inputUiInfo: {},
  };
  return handleAddingOrUpdatingStep({
    pieceSelectorItem: {
      ...CORE_STEP_METADATA[ActionType.ROUTER],
      displayName: t('Check Todo Status'),
    },
    operation: {
      type: FlowOperationType.ADD_ACTION,
      actionLocation: {
        parentStep: parentStepName,
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
      },
    },
    selectStepAfter: false,
    settings: routerInternalSettings,
    customLogoUrl: logoUrl,
  });
};

const createTodoStep = ({
  pieceMetadata,
  operation,
  todoType,
  handleAddingOrUpdatingStep,
}: {
  pieceMetadata: PieceStepMetadataWithSuggestions;
  operation: PieceSelectorOperation;
  todoType: TodoType;
  handleAddingOrUpdatingStep: BuilderState['handleAddingOrUpdatingStep'];
}) => {
  const actionName = getTodoActionName(todoType);
  const createTodoAction = getActionFromPieceMetadata(
    pieceMetadata,
    actionName,
  );
  if (isNil(createTodoAction)) {
    return null;
  }
  return handleAddingOrUpdatingStep({
    pieceSelectorItem: {
      actionOrTrigger: createTodoAction,
      type: ActionType.PIECE,
      pieceMetadata: pieceMetadata,
    },
    operation,
    selectStepAfter: true,
  });
};

const createWaitForApprovalStep = ({
  pieceMetadata,
  parentStepName,
  handleAddingOrUpdatingStep,
}: {
  pieceMetadata: PieceStepMetadataWithSuggestions;
  parentStepName: string;
  handleAddingOrUpdatingStep: BuilderState['handleAddingOrUpdatingStep'];
}) => {
  const waitForApprovalAction = getActionFromPieceMetadata(
    pieceMetadata,
    TODO_ACTIONS.wait_for_approval,
  );
  if (isNil(waitForApprovalAction)) {
    return null;
  }
  const pieceSelectorItem: PieceSelectorItem = {
    actionOrTrigger: waitForApprovalAction,
    type: ActionType.PIECE,
    pieceMetadata: pieceMetadata,
  };
  const waitForApprovalStep = {
    pieceSelectorItem,
    operation: {
      type: FlowOperationType.ADD_ACTION,
      actionLocation: {
        parentStep: parentStepName,
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
      },
    },
    selectStepAfter: false,
  } as const;
  const waitForApprovalStepName =
    handleAddingOrUpdatingStep(waitForApprovalStep);
  const defaultValues = pieceSelectorUtils.getDefaultStepValues({
    stepName: waitForApprovalStepName,
    pieceSelectorItem: {
      actionOrTrigger: waitForApprovalAction,
      type: ActionType.PIECE,
      pieceMetadata: pieceMetadata,
    },
  });
  defaultValues.settings.input.taskId = `{{ ${parentStepName}['id'] }}`;
  return handleAddingOrUpdatingStep({
    pieceSelectorItem,
    operation: {
      type: FlowOperationType.UPDATE_ACTION,
      stepName: waitForApprovalStepName,
    },
    selectStepAfter: false,
    settings: defaultValues.settings,
  });
};

const CreateTodoDialog = ({
  operation,
  pieceSelectorItem,
  hidePieceIcon,
}: CreateTodoGuideProps) => {
  const [todoType, setTodoType] = useState<TodoType>(TodoType.INTERNAL);
  const [hoveredOption, setHoveredOption] = useState<TodoType | null>(null);
  const displayImageType = hoveredOption || todoType;
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);

  const handleAddCreateTodoAction = () => {
    const todoStepName = createTodoStep({
      pieceMetadata: pieceSelectorItem.pieceMetadata,
      operation,
      todoType,
      handleAddingOrUpdatingStep,
    });
    if (isNil(todoStepName)) {
      return;
    }
    switch (todoType) {
      case TodoType.INTERNAL: {
        createRouterStep({
          parentStepName: todoStepName,
          logoUrl: pieceSelectorItem.pieceMetadata.logoUrl,
          handleAddingOrUpdatingStep,
        });
        break;
      }
      case TodoType.EXTERNAL: {
        const waitForApprovalStepName = createWaitForApprovalStep({
          pieceMetadata: pieceSelectorItem.pieceMetadata,
          parentStepName: todoStepName,
          handleAddingOrUpdatingStep,
        });
        if (!waitForApprovalStepName) {
          return;
        }
        createRouterStep({
          parentStepName: waitForApprovalStepName,
          logoUrl: pieceSelectorItem.pieceMetadata.logoUrl,
          handleAddingOrUpdatingStep,
        });
        break;
      }
    }
  };
  const [open, setOpen] = useState(false);
  return (
    <>
      <GenericActionOrTriggerItem
        item={pieceSelectorItem}
        hidePieceIcon={hidePieceIcon}
        stepMetadataWithSuggestions={pieceSelectorItem.pieceMetadata}
        onClick={() => setOpen(true)}
      ></GenericActionOrTriggerItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl">
              {t('Create Todo Guide')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2 space-y-6">
                <h3 className="text-lg font-medium">
                  {t('Where would you like the todo to be reviewed?')}
                </h3>

                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      todoType === TodoType.INTERNAL
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => setTodoType(TodoType.INTERNAL)}
                    onMouseEnter={() => setHoveredOption(TodoType.INTERNAL)}
                    onMouseLeave={() => setHoveredOption(null)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium flex items-center gap-2">
                        {t('Activepieces Todos')}
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs cursor-help">
                              i
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="w-[550px]">
                            <div className="space-y-2">
                              <p className="text-sm">
                                {t(
                                  'Users will manage tasks directly in Activepieces',
                                )}
                              </p>
                              <div className="bg-muted rounded p-1">
                                <img
                                  src={ActivepiecesTodo}
                                  alt="Activepieces Todo UI"
                                  className="w-full h-auto rounded"
                                />
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </h4>
                      <div className="flex-shrink-0 w-5 h-5">
                        <div
                          className={`w-5 h-5 rounded-full grid place-items-center border ${
                            todoType === TodoType.INTERNAL
                              ? 'border-primary'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {todoType === TodoType.INTERNAL && (
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'Users will manage and respond to todos directly within the Activepieces interface. Ideal for internal teams.',
                      )}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      todoType === TodoType.EXTERNAL
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => setTodoType(TodoType.EXTERNAL)}
                    onMouseEnter={() => setHoveredOption(TodoType.EXTERNAL)}
                    onMouseLeave={() => setHoveredOption(null)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium">
                        {t('External Channel (Slack, Teams, Email, ...)')}
                      </h4>
                      <div className="flex-shrink-0 w-5 h-5">
                        <div
                          className={`w-5 h-5 rounded-full grid place-items-center border ${
                            todoType === TodoType.EXTERNAL
                              ? 'border-primary'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {todoType === TodoType.EXTERNAL && (
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'Send notifications with approval links via external channels like Slack, Teams or Email. Best for collaborating with external stakeholders.',
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2 flex flex-col items-center justify-center">
                <div className="border rounded-lg overflow-hidden p-3 w-full h-full">
                  <div className="flex flex-col items-center h-[480px]">
                    <h3 className="text-md font-medium mb-3 text-center">
                      {displayImageType === TodoType.INTERNAL
                        ? t('Preview (Activepieces Todos)')
                        : t('Preview (External channel)')}
                    </h3>

                    <div className="w-full h-[350px] overflow-hidden rounded mb-2 flex items-center justify-center bg-muted/50 relative">
                      <img
                        src={
                          displayImageType === TodoType.INTERNAL
                            ? ActivepiecesCreateTodoGuide
                            : ExternalChannelTodo
                        }
                        alt={
                          displayImageType === TodoType.INTERNAL
                            ? 'Activepieces Todos flow'
                            : 'External channel flow'
                        }
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white dark:from-background to-transparent"></div>
                    </div>

                    <p className="text-sm text-muted-foreground italic text-center mb-2">
                      {displayImageType === TodoType.INTERNAL
                        ? t(
                            'Todos allow users to review and resolve tasks directly in our interface',
                          )
                        : t(
                            'You can add the channel before the Wait Step, and configure the logic in the Router step',
                          )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 mt-3 pt-3 border-t">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              className="mr-2"
            >
              {t('Cancel')}
            </Button>
            <Button onClick={handleAddCreateTodoAction}>
              {t('Add Steps')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

CreateTodoDialog.displayName = 'CreateTodoDialog';
export { CreateTodoDialog };
