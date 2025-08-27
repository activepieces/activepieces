import { t } from 'i18next';

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
  FlowActionType,
  Agent,
  BranchExecutionType,
  BranchOperator,
  FlowOperationType,
  isNil,
  RouterActionSettings,
  RouterExecutionType,
  StepLocationRelativeToParent,
  TodoType,
} from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';

const getTodoActionName = (todoType: TodoType) => {
  switch (todoType) {
    case TodoType.INTERNAL:
      return TODO_ACTIONS.createTodoAndWait;
    case TodoType.EXTERNAL:
      return TODO_ACTIONS.createTodo;
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

export const createRouterStep = ({
  parentStepName,
  logoUrl,
  handleAddingOrUpdatingStep,
}: {
  parentStepName: string;
  logoUrl: string;
  handleAddingOrUpdatingStep: BuilderState['handleAddingOrUpdatingStep'];
}) => {
  const routerOnApprovalSettings: RouterActionSettings = {
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
  };
  return handleAddingOrUpdatingStep({
    pieceSelectorItem: {
      ...CORE_STEP_METADATA[FlowActionType.ROUTER],
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
    overrideSettings: routerOnApprovalSettings,
    customLogoUrl: logoUrl,
  });
};

export const createTodoStep = ({
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
      type: FlowActionType.PIECE,
      pieceMetadata: pieceMetadata,
    },
    operation,
    selectStepAfter: true,
  });
};

export const createWaitForApprovalStep = ({
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
    TODO_ACTIONS.waitForApproval,
  );
  if (isNil(waitForApprovalAction)) {
    return null;
  }
  const pieceSelectorItem: PieceSelectorItem = {
    actionOrTrigger: waitForApprovalAction,
    type: FlowActionType.PIECE,
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
      type: FlowActionType.PIECE,
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
    overrideSettings: defaultValues.settings,
  });
};

export const overrideDisplayInfoForPieceSelectorItemWithAgentInfo = (
  pieceSelectorItem: PieceSelectorPieceItem,
  agent: Agent,
): PieceSelectorPieceItem => {
  const agentPieceSelectorItem: PieceSelectorPieceItem = JSON.parse(
    JSON.stringify(pieceSelectorItem),
  );
  agentPieceSelectorItem.pieceMetadata.logoUrl = agent.profilePictureUrl;
  agentPieceSelectorItem.actionOrTrigger.description = agent.description;
  agentPieceSelectorItem.actionOrTrigger.displayName = agent.displayName;
  return agentPieceSelectorItem;
};

export const handleAddingOrUpdatingCustomAgentPieceSelectorItem = (
  pieceSelectorItem: PieceSelectorPieceItem,
  agent: Agent,
  operation: PieceSelectorOperation,
  handleAddingOrUpdatingStep: BuilderState['handleAddingOrUpdatingStep'],
) => {
  const agentPieceSelectorItem =
    overrideDisplayInfoForPieceSelectorItemWithAgentInfo(
      pieceSelectorItem,
      agent,
    );
  const stepName = handleAddingOrUpdatingStep({
    pieceSelectorItem: agentPieceSelectorItem,
    operation,
    selectStepAfter: true,
  });
  const defaultValues = pieceSelectorUtils.getDefaultStepValues({
    stepName,
    pieceSelectorItem: agentPieceSelectorItem,
  });
  defaultValues.settings.input.agentId = agent.externalId;
  return handleAddingOrUpdatingStep({
    pieceSelectorItem: agentPieceSelectorItem,
    operation: {
      type: FlowOperationType.UPDATE_ACTION,
      stepName,
    },
    selectStepAfter: false,
    overrideSettings: defaultValues.settings,
  });
};
