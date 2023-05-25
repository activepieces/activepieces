import {
  AddActionRequest,
  DeleteActionRequest,
  FlowOperationType,
  FlowOperationRequest,
  UpdateActionRequest,
  UpdateTriggerRequest,
  StepLocationRelativeToParent,
  MoveActionRequest,
} from './flow-operations';
import {
  Action,
  ActionType,
  BranchAction,
  LoopOnItemsAction,
} from './actions/action';
import { Trigger, TriggerType } from './triggers/trigger';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { FlowVersion, FlowVersionState } from './flow-version';
import { ActivepiecesError, ErrorCode } from '../common/activepieces-error';

type Step = Action | Trigger

type GetAllSubFlowSteps = {
  subFlowStartStep: Step
}

type GetStepFromSubFlow = {
  subFlowStartStep: Step
  stepName: string
}

const actionSchemaValidator = TypeCompiler.Compile(Action);
const triggerSchemaValidation = TypeCompiler.Compile(Trigger);

function isValid(flowVersion: FlowVersion) {
  let valid = true;
  const steps = flowHelper.getAllSteps(flowVersion);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    valid = valid && step.valid;
  }
  return valid;
}

function isAction(type: ActionType | TriggerType): boolean {
  return Object.entries(ActionType).some(([, value]) => value === type);
}

function deleteAction(
  flowVersion: FlowVersion,
  request: DeleteActionRequest
): void {
  const steps = getAllSteps(flowVersion);
  let deleted = false;
  for (let i = 0; i < steps.length; i++) {
    const parentStep = steps[i];
    if (parentStep.nextAction && parentStep.nextAction.name === request.name) {
      const stepToUpdate: Action = parentStep.nextAction;
      parentStep.nextAction = stepToUpdate.nextAction;
      deleted = true;
    }
    if (parentStep.type === ActionType.BRANCH) {
      if (parentStep.onFailureAction && parentStep.onFailureAction.name === request.name) {
        const stepToUpdate: Action = parentStep.onFailureAction;
        parentStep.onFailureAction = stepToUpdate.nextAction;
        deleted = true;
      }
      if (parentStep.onSuccessAction && parentStep.onSuccessAction.name === request.name) {
        const stepToUpdate: Action = parentStep.onSuccessAction;
        parentStep.onSuccessAction = stepToUpdate.nextAction;
        deleted = true;
      }
    }
    if (parentStep.type === ActionType.LOOP_ON_ITEMS) {
      if (parentStep.firstLoopAction && parentStep.firstLoopAction.name === request.name) {
        const stepToUpdate: Action = parentStep.firstLoopAction;
        parentStep.firstLoopAction = stepToUpdate.nextAction;
        deleted = true;
      }
    }
  }
  if (!deleted) {
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Action ${request.name} not found`);
  }
}

function getUsedPieces(trigger: Trigger): string[] {
  return traverseInternal(trigger)
  .filter((step) => step.type === ActionType.PIECE || step.type === TriggerType.PIECE)
  .map((step) => step.settings.pieceName)
  .filter((value, index, self) => self.indexOf(value) === index);
}

function traverseInternal(step: Trigger | Action | undefined): (Action | Trigger)[] {
  const steps: (Action | Trigger)[] = [];
  while (step !== undefined && step !== null) {
    steps.push(step);
    if (step.type === ActionType.BRANCH) {
      steps.push(...traverseInternal(step.onFailureAction));
      steps.push(...traverseInternal(step.onSuccessAction));
    }
    if (step.type === ActionType.LOOP_ON_ITEMS) {
      steps.push(...traverseInternal(step.firstLoopAction));
    }
    step = step.nextAction;
  }
  return steps;
}


function getAllSteps(flowVersion: FlowVersion): (Action | Trigger)[] {
  return traverseInternal(flowVersion.trigger);
}
function getAllChildSteps(action: LoopOnItemsAction | BranchAction): (Action)[] {
  switch(action.type)
  {
    case ActionType.LOOP_ON_ITEMS:
    return traverseInternal(action.firstLoopAction) as Action[];
    default:
      return [...traverseInternal(action.onSuccessAction),...traverseInternal(action.onFailureAction)] as Action[];
  }

}

function getStep(
  flowVersion: FlowVersion,
  stepName: string
): Action | Trigger | undefined {
  return getAllSteps(flowVersion).find((step) => step.name === stepName);
}

const getAllSubFlowSteps = ({ subFlowStartStep }: GetAllSubFlowSteps): Step[] => {
  return traverseInternal(subFlowStartStep);
}

const getStepFromSubFlow = ({ subFlowStartStep, stepName }: GetStepFromSubFlow): Step | undefined => {
  const subFlowSteps = getAllSubFlowSteps({
    subFlowStartStep,
  })

  return subFlowSteps.find((step) => step.name === stepName)
}

function updateAction(
  flowVersion: FlowVersion,
  request: UpdateActionRequest
): void {
  const steps = getAllSteps(flowVersion);
  let updated = false;
  for (let i = 0; i < steps.length; i++) {
    const parentStep = steps[i];
    if (parentStep.nextAction && parentStep.nextAction.name === request.name) {
      const actions = extractActions(parentStep.nextAction);
      parentStep.nextAction = createAction(request, actions);
      updated = true;
    }
    if (parentStep.type === ActionType.BRANCH) {
      if (parentStep.onFailureAction && parentStep.onFailureAction.name === request.name) {
        const actions = extractActions(parentStep.onFailureAction);
        parentStep.onFailureAction = createAction(request, actions);
        updated = true;
      }
      if (parentStep.onSuccessAction && parentStep.onSuccessAction.name === request.name) {
        const actions = extractActions(parentStep.onSuccessAction);
        parentStep.onSuccessAction = createAction(request, actions);
        updated = true;
      }
    }
    if (parentStep.type === ActionType.LOOP_ON_ITEMS) {

      if (parentStep.firstLoopAction && parentStep.firstLoopAction.name === request.name) {
        const actions = extractActions(parentStep.firstLoopAction);
        parentStep.firstLoopAction = createAction(request, actions);
        updated = true;
      }
    }
  }
  if (!updated) {
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Action ${request.name} not found`);
  }
}

function extractActions(step: Trigger | Action): { nextAction?: Action, onSuccessAction?: Action, onFailureAction?: Action , firstLoopAction?:Action } {
  const nextAction = step.nextAction;
  const onSuccessAction = step.type === ActionType.BRANCH ? step.onSuccessAction : undefined;
  const onFailureAction = step.type === ActionType.BRANCH ? step.onFailureAction : undefined;
  const firstLoopAction = step.type === ActionType.LOOP_ON_ITEMS ? step.firstLoopAction : undefined;
  return { nextAction, onSuccessAction, onFailureAction ,firstLoopAction};
}

function moveAction(flowVersion: FlowVersion, request: MoveActionRequest): void {
  const steps = getAllSteps(flowVersion);
  const sourceStep = steps.find(step => step.name === request.name);
  if (!sourceStep || !isAction(sourceStep?.type)) {
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Source step ${request.name} not found`);
  }
  const destinationStep = steps.find(step => step.name === request.newParentStep);
  if (!destinationStep) {
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Destination step ${request.newParentStep} not found`);
  }
  deleteAction(flowVersion, { name: request.name });
  addAction(flowVersion, {
    action: sourceStep as Action,
    parentStep: request.newParentStep,
    stepLocationRelativeToParent: request.stepLocationRelativeToNewParent
  });
}

function addAction(flowVersion: FlowVersion, request: AddActionRequest): void {
  const parentStep = getAllSteps(flowVersion).find(step => step.name === request.parentStep);
  if (parentStep === undefined) {
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Parent step ${request.parentStep} not found`);
  }
  if (parentStep.type === ActionType.LOOP_ON_ITEMS && request.stepLocationRelativeToParent) {
    if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_LOOP) {
      parentStep.firstLoopAction = createAction(request.action, {
        nextAction: parentStep.firstLoopAction
      });
    } else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.AFTER) {
      parentStep.nextAction = createAction(request.action, {
        nextAction: parentStep.nextAction
      });
    } else {
      throw new ActivepiecesError({
        code: ErrorCode.FLOW_OPERATION_INVALID,
        params: {}
      }, `Loop step parent ${request.stepLocationRelativeToParent} not found`);
    }
  } else if (parentStep.type === ActionType.BRANCH && request.stepLocationRelativeToParent) {
    if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_TRUE_BRANCH) {
      parentStep.onSuccessAction = createAction(request.action, {
        nextAction: parentStep.onSuccessAction
      });
    } else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_FALSE_BRANCH) {
      parentStep.onFailureAction = createAction(request.action, {
        nextAction: parentStep.onFailureAction
      });
    }
    else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.AFTER) {
      parentStep.nextAction = createAction(request.action, {
        nextAction: parentStep.nextAction
      });
    }
    else {
      throw new ActivepiecesError({
        code: ErrorCode.FLOW_OPERATION_INVALID,
        params: {}
      }, `Branch step parernt ${request.stepLocationRelativeToParent} not found`);
    }
  } else {
    parentStep.nextAction = createAction(request.action, {
      nextAction: parentStep.nextAction
    });
  }
}

function createAction(
  request: UpdateActionRequest,
  { nextAction, onFailureAction, onSuccessAction, firstLoopAction}: { nextAction?: Action, firstLoopAction?: Action, onSuccessAction?: Action, onFailureAction?: Action},
): Action {
  const baseProperties = {
    displayName: request.displayName,
    name: request.name,
    valid: false,
    nextAction: nextAction,
  };
  let action: Action;
  switch (request.type) {
    case ActionType.BRANCH:
      action = {
        ...baseProperties,
        onFailureAction: onFailureAction,
        onSuccessAction: onSuccessAction,
        type: ActionType.BRANCH,
        settings: request.settings,
      };
      break;
    case ActionType.LOOP_ON_ITEMS:
      action = {
        ...baseProperties,
        firstLoopAction: firstLoopAction,
        type: ActionType.LOOP_ON_ITEMS,
        settings: request.settings,
      };
      break;
    case ActionType.PIECE:
      action = {
        ...baseProperties,
        type: ActionType.PIECE,
        settings: request.settings,
      };
      break;
    case ActionType.CODE:
      action = {
        ...baseProperties,
        type: ActionType.CODE,
        settings: request.settings,
      };
      break;
    case ActionType.MISSING:
      action = {
        ...baseProperties,
        type: ActionType.MISSING,
        settings: request.settings,
      };
  }
  action.valid = (request.valid ?? true) && actionSchemaValidator.Check(action);
  return action;
}

function isChildOf(parent:LoopOnItemsAction | BranchAction,child:Action)
{
  switch(parent.type)
  {
    case ActionType.LOOP_ON_ITEMS:{
      const children = getAllChildSteps(parent);
      return children.findIndex(c=>c.name === child.name) >-1;}
    default:{
      const children = [...getAllChildSteps(parent),...getAllChildSteps(parent)];
      return children.findIndex(c=>c.name === child.name) >-1;}
  }



}
function createTrigger(
  name: string,
  request: UpdateTriggerRequest,
  nextAction: Action | undefined
): Trigger {
  const baseProperties = {
    displayName: request.displayName,
    name: name,
    valid: false,
    nextAction: nextAction,
  };
  let trigger: Trigger;
  switch (request.type) {
    case TriggerType.EMPTY:
      trigger = {
        ...baseProperties,
        type: TriggerType.EMPTY,
        settings: request.settings,
      };
      break;
    case TriggerType.PIECE:
      trigger = {
        ...baseProperties,
        type: TriggerType.PIECE,
        settings: request.settings,
      };
      break;
    case TriggerType.WEBHOOK:
      trigger = {
        ...baseProperties,
        type: TriggerType.WEBHOOK,
        settings: request.settings,
      };
      break;
  }
  trigger.valid =
    (request.valid ?? true) && triggerSchemaValidation.Check(trigger);
  return trigger;
}

export const flowHelper = {
  isValid: isValid,
  apply(
    flowVersion: FlowVersion,
    operation: FlowOperationRequest
  ): FlowVersion {
    const clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion));
    switch (operation.type) {
      case FlowOperationType.MOVE_ACTION:
        moveAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.LOCK_FLOW:
        clonedVersion.state = FlowVersionState.LOCKED;
        break;
      case FlowOperationType.CHANGE_NAME:
        clonedVersion.displayName = operation.request.displayName;
        break;
      case FlowOperationType.DELETE_ACTION:
        deleteAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.ADD_ACTION:
        addAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.UPDATE_ACTION:
        updateAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.UPDATE_TRIGGER:
        clonedVersion.trigger = createTrigger(
          clonedVersion.trigger.name,
          operation.request,
          clonedVersion.trigger.nextAction
        );
        break;
    }
    clonedVersion.valid = isValid(clonedVersion);
    return clonedVersion;
  },
  getStep,
  isAction,
  getAllSteps,
  getUsedPieces,
  getAllSubFlowSteps,
  getStepFromSubFlow,
  isChildOf,
  getAllChildSteps,
};
