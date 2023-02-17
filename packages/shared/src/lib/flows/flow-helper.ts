import {
  AddActionRequest,
  DeleteActionRequest,
  FlowOperationType,
  FlowOperationRequest,
  UpdateActionRequest,
  UpdateTriggerRequest,
} from './flow-operations';
import {
  Action,
  ActionType,
  CodeAction,
  PieceAction,
  StorageAction,
  LoopOnItemsAction,
} from './actions/action';
import { Trigger, TriggerType } from './triggers/trigger';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { FlowVersion } from './flow-version';

const actionSchemaValidator = TypeCompiler.Compile(Action);
const triggerSchemaValidation = TypeCompiler.Compile(Trigger);

function isValid(flowVersion: FlowVersion) {
  let valid = true;
  let step: Action | Trigger | undefined = flowVersion.trigger;
  while (step !== undefined) {
    valid = valid && step.valid;
    step = step.nextAction;
  }
  return valid;
}

function deleteAction(
  flowVersion: FlowVersion,
  request: DeleteActionRequest
): void {
  let parentStep: Trigger | Action = flowVersion.trigger;
  while (
    parentStep.nextAction !== undefined &&
    parentStep.nextAction.name !== request.name
  ) {
    parentStep = parentStep.nextAction;
  }
  if (parentStep.nextAction !== undefined) {
    const stepToUpdate: Action = parentStep.nextAction;
    parentStep.nextAction = stepToUpdate.nextAction;
  }
}

export function getStep(
  flowVersion: FlowVersion,
  stepName: string
): Action | Trigger | undefined {
  let currentStep: Trigger | Action | undefined = flowVersion.trigger;
  while (currentStep !== undefined && currentStep.name !== stepName) {
    currentStep = currentStep.nextAction;
  }
  return currentStep;
}

function updateAction(
  flowVersion: FlowVersion,
  request: UpdateActionRequest
): void {
  let parentStep: Trigger | Action = flowVersion.trigger;
  while (
    parentStep.nextAction !== undefined &&
    parentStep.nextAction.name !== request.name
  ) {
    parentStep = parentStep.nextAction;
  }
  if (parentStep.nextAction !== undefined) {
    const stepToUpdate: Action = parentStep.nextAction;
    parentStep.nextAction = createAction(request, stepToUpdate.nextAction);
  }
}

function addAction(flowVersion: FlowVersion, request: AddActionRequest): void {
  let currentStep: Trigger | Action = flowVersion.trigger;
  while (
    currentStep?.nextAction !== undefined &&
    currentStep.name !== request.parentAction
  ) {
    currentStep = currentStep.nextAction;
  }
  currentStep.nextAction = createAction(request.action, currentStep.nextAction);
}

function createAction(
  request: UpdateActionRequest,
  nextAction: Action | undefined
): Action {
  const baseProperties = {
    displayName: request.displayName,
    name: request.name,
    valid: false,
    nextAction: nextAction,
  };
  let action;
  switch (request.type) {
    case ActionType.STORAGE:
      action = {
        ...baseProperties,
        type: ActionType.STORAGE,
        settings: request.settings,
      } as StorageAction;
      break;
    case ActionType.LOOP_ON_ITEMS:
      action = {
        ...baseProperties,
        type: ActionType.LOOP_ON_ITEMS,
        settings: request.settings,
      } as LoopOnItemsAction;
      break;
    case ActionType.PIECE:
      action = {
        ...baseProperties,
        type: ActionType.PIECE,
        settings: request.settings,
      } as PieceAction;
      break;
    case ActionType.CODE:
      action = {
        ...baseProperties,
        type: ActionType.CODE,
        settings: request.settings,
      } as CodeAction;
      break;
  }
  action.valid = (request.valid ?? true) && actionSchemaValidator.Check(action);
  return action;
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
    case TriggerType.SCHEDULE:
      trigger = {
        ...baseProperties,
        type: TriggerType.SCHEDULE,
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
      default:
        throw new Error('Unknown operation type');
    }
    clonedVersion.valid = isValid(clonedVersion);
    return clonedVersion;
  },
  getStep: getStep,
  clone: (flowVersion: FlowVersion): FlowVersion => {
    return JSON.parse(JSON.stringify(flowVersion));
  },
};
