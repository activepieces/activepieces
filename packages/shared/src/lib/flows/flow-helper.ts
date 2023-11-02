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
  SingleActionSchema,
} from './actions/action';
import { Trigger, TriggerType } from './triggers/trigger';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { FlowVersion, FlowVersionState } from './flow-version';
import { ActivepiecesError, ErrorCode } from '../common/activepieces-error';
import semver from 'semver';
import { applyFunctionToValuesSync, isString } from '../common';

type Step = Action | Trigger;

type GetAllSubFlowSteps = {
  subFlowStartStep: Step;
};

type GetStepFromSubFlow = {
  subFlowStartStep: Step;
  stepName: string;
};

const actionSchemaValidator = TypeCompiler.Compile(SingleActionSchema);
const triggerSchemaValidation = TypeCompiler.Compile(Trigger);

function isValid(flowVersion: FlowVersion) {
  let valid = true;
  const steps = flowHelper.getAllSteps(flowVersion.trigger);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    valid = valid && step.valid;
  }
  return valid;
}

function isAction(type: ActionType | TriggerType | undefined): boolean {
  return Object.entries(ActionType).some(([, value]) => value === type);
}

function isTrigger(type: ActionType | TriggerType | undefined): boolean {
  return Object.entries(TriggerType).some(([, value]) => value === type);
}

function deleteAction(
  flowVersion: FlowVersion,
  request: DeleteActionRequest
): FlowVersion {
  return transferFlow(flowVersion, (parentStep) => {
    if (parentStep.nextAction && parentStep.nextAction.name === request.name) {
      const stepToUpdate: Action = parentStep.nextAction;
      parentStep.nextAction = stepToUpdate.nextAction;
    }
    switch (parentStep.type) {
      case ActionType.BRANCH: {
        if (
          parentStep.onFailureAction &&
          parentStep.onFailureAction.name === request.name
        ) {
          const stepToUpdate: Action = parentStep.onFailureAction;
          parentStep.onFailureAction = stepToUpdate.nextAction;
        }
        if (
          parentStep.onSuccessAction &&
          parentStep.onSuccessAction.name === request.name
        ) {
          const stepToUpdate: Action = parentStep.onSuccessAction;
          parentStep.onSuccessAction = stepToUpdate.nextAction;
        }
        break;
      }
      case ActionType.LOOP_ON_ITEMS: {
        if (
          parentStep.firstLoopAction &&
          parentStep.firstLoopAction.name === request.name
        ) {
          const stepToUpdate: Action = parentStep.firstLoopAction;
          parentStep.firstLoopAction = stepToUpdate.nextAction;
        }
        break;
      }
      case ActionType.CODE:
      case ActionType.PIECE:
        break;
    }
    return parentStep;
  });
}

function getUsedPieces(trigger: Trigger): string[] {
  return traverseInternal(trigger)
    .filter(
      (step) =>
        step.type === ActionType.PIECE || step.type === TriggerType.PIECE
    )
    .map((step) => step.settings.pieceName)
    .filter((value, index, self) => self.indexOf(value) === index);
}

function traverseInternal(
  step: Trigger | Action | undefined
): (Action | Trigger)[] {
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

async function transferStepAsync<T extends Step>(
  step: Step,
  transferFunction: (step: T) => Promise<T>
): Promise<Step> {
  const updatedStep = await transferFunction(step as T);

  if (updatedStep.type === ActionType.BRANCH) {
    const { onSuccessAction, onFailureAction } = updatedStep;
    if (onSuccessAction) {
      updatedStep.onSuccessAction = (await transferStepAsync(
        onSuccessAction,
        transferFunction
      )) as Action;
    }
    if (onFailureAction) {
      updatedStep.onFailureAction = (await transferStepAsync(
        onFailureAction,
        transferFunction
      )) as Action;
    }
  } else if (updatedStep.type === ActionType.LOOP_ON_ITEMS) {
    const { firstLoopAction } = updatedStep;
    if (firstLoopAction) {
      updatedStep.firstLoopAction = (await transferStepAsync(
        firstLoopAction,
        transferFunction
      )) as Action;
    }
  }

  if (updatedStep.nextAction) {
    updatedStep.nextAction = (await transferStepAsync(
      updatedStep.nextAction,
      transferFunction
    )) as Action;
  }

  return updatedStep;
}

function transferStep<T extends Step>(
  step: Step,
  transferFunction: (step: T) => T
): Step {
  const updatedStep = transferFunction(step as T);
  if (updatedStep.type === ActionType.BRANCH) {
    const { onSuccessAction, onFailureAction } = updatedStep;
    if (onSuccessAction) {
      updatedStep.onSuccessAction = transferStep(
        onSuccessAction,
        transferFunction
      ) as Action;
    }
    if (onFailureAction) {
      updatedStep.onFailureAction = transferStep(
        onFailureAction,
        transferFunction
      ) as Action;
    }
  } else if (updatedStep.type === ActionType.LOOP_ON_ITEMS) {
    const { firstLoopAction } = updatedStep;
    if (firstLoopAction) {
      updatedStep.firstLoopAction = transferStep(
        firstLoopAction,
        transferFunction
      ) as Action;
    }
  }

  if (updatedStep.nextAction) {
    updatedStep.nextAction = transferStep(
      updatedStep.nextAction,
      transferFunction
    ) as Action;
  }

  return updatedStep;
}

async function transferFlowAsync<T extends Step>(
  flowVersion: FlowVersion,
  transferFunction: (step: T) => Promise<T>
): Promise<FlowVersion> {
  const clonedFlow = JSON.parse(JSON.stringify(flowVersion));
  clonedFlow.trigger = (await transferStepAsync(
    clonedFlow.trigger,
    transferFunction
  )) as Trigger;
  return clonedFlow;
}

function transferFlow<T extends Step>(
  flowVersion: FlowVersion,
  transferFunction: (step: T) => T
): FlowVersion {
  const clonedFlow = JSON.parse(JSON.stringify(flowVersion));
  clonedFlow.trigger = transferStep(
    clonedFlow.trigger,
    transferFunction
  ) as Trigger;
  return clonedFlow;
}
function getAllSteps(trigger: Trigger): (Action | Trigger)[] {
  return traverseInternal(trigger);
}

function getAllStepsAtFirstLevel(step: Trigger): (Action | Trigger)[] {
  const steps: (Action | Trigger)[] = [];
  while (step !== undefined && step !== null) {
    steps.push(step);
    step = step.nextAction;
  }
  return steps;
}
function getAllChildSteps(action: LoopOnItemsAction | BranchAction): Action[] {
  switch (action.type) {
    case ActionType.LOOP_ON_ITEMS:
      return traverseInternal(action.firstLoopAction) as Action[];
    default:
      return [
        ...traverseInternal(action.onSuccessAction),
        ...traverseInternal(action.onFailureAction)
      ] as Action[];
  }
}

function getStep(
  flowVersion: FlowVersion,
  stepName: string
): Action | Trigger | undefined {
  return getAllSteps(flowVersion.trigger).find(
    (step) => step.name === stepName
  );
}

const getAllSubFlowSteps = ({
  subFlowStartStep
}: GetAllSubFlowSteps): Step[] => {
  return traverseInternal(subFlowStartStep);
};

const getStepFromSubFlow = ({
  subFlowStartStep,
  stepName
}: GetStepFromSubFlow): Step | undefined => {
  const subFlowSteps = getAllSubFlowSteps({
    subFlowStartStep
  });

  return subFlowSteps.find((step) => step.name === stepName);
};

function updateAction(
  flowVersion: FlowVersion,
  request: UpdateActionRequest
): FlowVersion {
  return transferFlow(flowVersion, (parentStep) => {
    if (parentStep.nextAction && parentStep.nextAction.name === request.name) {
      const actions = extractActions(parentStep.nextAction);
      parentStep.nextAction = createAction(request, actions);
    }
    if (parentStep.type === ActionType.BRANCH) {
      if (
        parentStep.onFailureAction &&
        parentStep.onFailureAction.name === request.name
      ) {
        const actions = extractActions(parentStep.onFailureAction);
        parentStep.onFailureAction = createAction(request, actions);
      }
      if (
        parentStep.onSuccessAction &&
        parentStep.onSuccessAction.name === request.name
      ) {
        const actions = extractActions(parentStep.onSuccessAction);
        parentStep.onSuccessAction = createAction(request, actions);
      }
    }
    if (parentStep.type === ActionType.LOOP_ON_ITEMS) {
      if (
        parentStep.firstLoopAction &&
        parentStep.firstLoopAction.name === request.name
      ) {
        const actions = extractActions(parentStep.firstLoopAction);
        parentStep.firstLoopAction = createAction(request, actions);
      }
    }
    return parentStep;
  });
}

function extractActions(step: Trigger | Action): {
  nextAction?: Action;
  onSuccessAction?: Action;
  onFailureAction?: Action;
  firstLoopAction?: Action;
} {
  const nextAction = step.nextAction;
  const onSuccessAction =
    step.type === ActionType.BRANCH ? step.onSuccessAction : undefined;
  const onFailureAction =
    step.type === ActionType.BRANCH ? step.onFailureAction : undefined;
  const firstLoopAction =
    step.type === ActionType.LOOP_ON_ITEMS ? step.firstLoopAction : undefined;
  return { nextAction, onSuccessAction, onFailureAction, firstLoopAction };
}

function moveAction(
  flowVersion: FlowVersion,
  request: MoveActionRequest
): FlowVersion {
  const steps = getAllSteps(flowVersion.trigger);
  const sourceStep = steps.find((step) => step.name === request.name);
  if (!sourceStep || !isAction(sourceStep?.type)) {
    throw new ActivepiecesError(
      {
        code: ErrorCode.FLOW_OPERATION_INVALID,
        params: {}
      },
      `Source step ${request.name} not found`
    );
  }
  const destinationStep = steps.find(
    (step) => step.name === request.newParentStep
  );
  if (!destinationStep) {
    throw new ActivepiecesError(
      {
        code: ErrorCode.FLOW_OPERATION_INVALID,
        params: {}
      },
      `Destination step ${request.newParentStep} not found`
    );
  }
  const childOperation: FlowOperationRequest[] = [];
  const clonedSourceStep: Step = JSON.parse(JSON.stringify(sourceStep));
  if (
    clonedSourceStep.type === ActionType.LOOP_ON_ITEMS ||
    clonedSourceStep.type === ActionType.BRANCH
  ) {
    // Don't Clone the next action for first step only
    clonedSourceStep.nextAction = undefined;
    childOperation.push(...getImportOperations(clonedSourceStep));
  }
  flowVersion = deleteAction(flowVersion, { name: request.name });
  flowVersion = addAction(flowVersion, {
    action: sourceStep as Action,
    parentStep: request.newParentStep,
    stepLocationRelativeToParent: request.stepLocationRelativeToNewParent
  });

  childOperation.forEach((operation) => {
    flowVersion = flowHelper.apply(flowVersion, operation);
  });
  return flowVersion;
}


function addAction(
  flowVersion: FlowVersion,
  request: AddActionRequest
): FlowVersion {
  return transferFlow(flowVersion, (parentStep: Step) => {

    if (parentStep.name !== request.parentStep) {
      return parentStep;
    }
    if (
      parentStep.type === ActionType.LOOP_ON_ITEMS &&
      request.stepLocationRelativeToParent
    ) {
      if (
        request.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.INSIDE_LOOP
      ) {
        parentStep.firstLoopAction = createAction(request.action, {
          nextAction: parentStep.firstLoopAction
        });
      } else if (
        request.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.AFTER
      ) {

        parentStep.nextAction = createAction(request.action, {
          nextAction: parentStep.nextAction,

        });
      } else {
        throw new ActivepiecesError(
          {
            code: ErrorCode.FLOW_OPERATION_INVALID,
            params: {}
          },
          `Loop step parent ${request.stepLocationRelativeToParent} not found`
        );
      }
    } else if (
      parentStep.type === ActionType.BRANCH &&
      request.stepLocationRelativeToParent
    ) {
      if (
        request.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
      ) {
        parentStep.onSuccessAction = createAction(request.action, {
          nextAction: parentStep.onSuccessAction
        });
      } else if (
        request.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.INSIDE_FALSE_BRANCH
      ) {
        parentStep.onFailureAction = createAction(request.action, {
          nextAction: parentStep.onFailureAction
        });
      } else if (
        request.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.AFTER
      ) {
        parentStep.nextAction = createAction(request.action, {
          nextAction: parentStep.nextAction
        });
      } else {
        throw new ActivepiecesError(
          {
            code: ErrorCode.FLOW_OPERATION_INVALID,
            params: {}
          },
          `Branch step parernt ${request.stepLocationRelativeToParent} not found`
        );
      }
    } else {
      parentStep.nextAction = createAction(request.action, {
        nextAction: parentStep.nextAction
      });
    }
    return parentStep;
  });
}

function createAction(
  request: UpdateActionRequest,
  {
    nextAction,
    onFailureAction,
    onSuccessAction,
    firstLoopAction
  }: {
    nextAction?: Action;
    firstLoopAction?: Action;
    onSuccessAction?: Action;
    onFailureAction?: Action;
  }
): Action {
  const baseProperties = {
    displayName: request.displayName,
    name: request.name,
    valid: false,
    nextAction: nextAction
  };
  let action: Action;
  switch (request.type) {
    case ActionType.BRANCH:
      action = {
        ...baseProperties,
        onFailureAction: onFailureAction,
        onSuccessAction: onSuccessAction,
        type: ActionType.BRANCH,
        settings: request.settings
      };
      break;
    case ActionType.LOOP_ON_ITEMS:
      action = {
        ...baseProperties,
        firstLoopAction: firstLoopAction,
        type: ActionType.LOOP_ON_ITEMS,
        settings: request.settings
      };
      break;
    case ActionType.PIECE:
      action = {
        ...baseProperties,
        type: ActionType.PIECE,
        settings: request.settings
      };
      break;
    case ActionType.CODE:
      action = {
        ...baseProperties,
        type: ActionType.CODE,
        settings: request.settings
      };
      break;
  }
  action.valid = (request.valid ?? true) && actionSchemaValidator.Check(action);
  return action;
}

function isChildOf(parent: LoopOnItemsAction | BranchAction, child: Action) {
  switch (parent.type) {
    case ActionType.LOOP_ON_ITEMS: {
      const children = getAllChildSteps(parent);
      return children.findIndex((c) => c.name === child.name) > -1;
    }
    default: {
      const children = [
        ...getAllChildSteps(parent),
        ...getAllChildSteps(parent)
      ];
      return children.findIndex((c) => c.name === child.name) > -1;
    }
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
    nextAction: nextAction
  };
  let trigger: Trigger;
  switch (request.type) {
    case TriggerType.EMPTY:
      trigger = {
        ...baseProperties,
        type: TriggerType.EMPTY,
        settings: request.settings
      };
      break;
    case TriggerType.PIECE:
      trigger = {
        ...baseProperties,
        type: TriggerType.PIECE,
        settings: request.settings
      };
      break;
    case TriggerType.WEBHOOK:
      trigger = {
        ...baseProperties,
        type: TriggerType.WEBHOOK,
        settings: request.settings
      };
      break;
  }
  trigger.valid =
    (request.valid ?? true) && triggerSchemaValidation.Check(trigger);
  return trigger;
}

export function getImportOperations(
  step: Action | Trigger | undefined
): FlowOperationRequest[] {
  const steps: FlowOperationRequest[] = [];
  while (step) {
    if (step.nextAction) {
      steps.push({
        type: FlowOperationType.ADD_ACTION,
        request: {
          parentStep: step.name,
          action: keepBaseAction(step.nextAction)
        }
      });
    }
    if (step.type === ActionType.BRANCH) {
      if (step.onFailureAction) {
        steps.push({
          type: FlowOperationType.ADD_ACTION,
          request: {
            parentStep: step.name,
            stepLocationRelativeToParent:
              StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
            action: keepBaseAction(step.onFailureAction)
          }
        });
        steps.push(...getImportOperations(step.onFailureAction));
      }
      if (step.onSuccessAction) {
        steps.push({
          type: FlowOperationType.ADD_ACTION,
          request: {
            parentStep: step.name,
            stepLocationRelativeToParent:
              StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
            action: keepBaseAction(step.onSuccessAction)
          }
        });
        steps.push(...getImportOperations(step.onSuccessAction));
      }
    }
    if (step.type === ActionType.LOOP_ON_ITEMS && step.firstLoopAction) {
      steps.push({
        type: FlowOperationType.ADD_ACTION,
        request: {
          parentStep: step.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_LOOP,
          action: keepBaseAction(step.firstLoopAction)
        }
      });
      steps.push(...getImportOperations(step.firstLoopAction));
    }
    step = step.nextAction;
  }
  return steps;
}

// It's better to use switch case, to enforce that all actions are covered
// TODO this can be simplified
function keepBaseAction(action: Action): Action {
  const commonProps = {
    name: action.name,
    displayName: action.displayName,
    valid: action.valid
  };
  switch (action.type) {
    case ActionType.BRANCH:
      // PICK type and settings from action
      return {
        type: ActionType.BRANCH,
        settings: action.settings,
        ...commonProps
      };
    case ActionType.LOOP_ON_ITEMS:
      return {
        type: ActionType.LOOP_ON_ITEMS,
        settings: action.settings,
        ...commonProps
      };
    case ActionType.CODE:
      return {
        type: action.type,
        settings: action.settings,
        ...commonProps
      };
    case ActionType.PIECE:
      return {
        type: action.type,
        settings: action.settings,
        ...commonProps
      };
  }
}

function upgradePiece(step: Step, stepName: string): Step {
  if (step.name !== stepName) {
    return step;
  }
  const clonedStep: Step = JSON.parse(JSON.stringify(step));
  switch (step.type) {
    case ActionType.PIECE:
    case TriggerType.PIECE: {
      const { pieceVersion, pieceName } = step.settings;
      if (isLegacyApp({ pieceName, pieceVersion })) {
        return step;
      }
      if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
        return step;
      }
      if (semver.valid(pieceVersion) && semver.lt(pieceVersion, '1.0.0')) {
        clonedStep.settings.pieceVersion = `~${pieceVersion}`;
      } else {
        clonedStep.settings.pieceVersion = `^${pieceVersion}`;
      }
      break;
    }
  }
  return clonedStep;
}

// TODO Remove this in 2024, these pieces didn't follow the standarad versioning where the minor version has to be increased when there is breaking change.
function isLegacyApp({ pieceName, pieceVersion }: { pieceName: string, pieceVersion: string }) {
  let newVersion = pieceVersion;
  if (newVersion.startsWith("^") || newVersion.startsWith("~")) {
    newVersion = newVersion.substring(1)
  }
  if (
    pieceName === '@activepieces/piece-google-sheets' &&
    semver.lt(newVersion, '0.3.0')
  ) {
    return true;
  }
  if (
    pieceName === '@activepieces/piece-gmail' &&
    semver.lt(newVersion, '0.3.0')
  ) {
    return true;
  }
  return false;
}

function duplicateStep(stepName: string, flowVersionWithArtifacts: FlowVersion): FlowVersion {
  const clonedStep = JSON.parse(JSON.stringify(flowHelper.getStep(flowVersionWithArtifacts, stepName)));
  clonedStep.nextAction = undefined;
  if (!clonedStep) {
    throw new Error(`step with name '${stepName}' not found`);
  }
  const existingNames = getAllSteps(flowVersionWithArtifacts.trigger).map((step) => step.name);
  const oldStepsNameToReplace = getAllSteps(clonedStep).map((step) => step.name);
  const oldNameToNewName: { [key: string]: string } = {};

  oldStepsNameToReplace.forEach((name) => {
    const newName = findUnusedName(existingNames, 'step');
    oldNameToNewName[name] = newName;
    existingNames.push(newName);
  });

  const duplicatedStep = transferStep(clonedStep, (step: Step) => {
    step.displayName = `${step.displayName} Copy`;
    step.name = oldNameToNewName[step.name];
    if (step.settings.inputUiInfo) {
      step.settings.inputUiInfo.currentSelectedData = undefined;
      step.settings.inputUiInfo.lastTestDate = undefined;
    }
    oldStepsNameToReplace.forEach((oldName) => {
      step.settings.input = applyFunctionToValuesSync(step.settings.input, (value: unknown) => {
        if (isString(value)) {
          return replaceOldStepNameWithNewOne({ input: value, oldStepName: oldName, newStepName: oldNameToNewName[oldName] });
        }
        return value;
      });
    });
    return step;
  })
  let finalFlow = addAction(flowVersionWithArtifacts, {
    action: duplicatedStep as Action,
    parentStep: stepName,
    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER
  });
  const operations = getImportOperations(duplicatedStep);
  operations.forEach((operation) => {
    finalFlow = flowHelper.apply(finalFlow, operation);
  });
  return finalFlow;
}

function replaceOldStepNameWithNewOne({ input, oldStepName, newStepName }: { input: string, oldStepName: string, newStepName: string }) {
  const regex = /{{(.*?)}}/g; // Regular expression to match strings inside {{ }}
  return input.replace(regex, (match, content) => {
    // Replace the content inside {{ }} using the provided function
    const replacedContent = content.replaceAll(new RegExp(`\\b${oldStepName}\\b`, 'g'), `${newStepName}`)

    // Reconstruct the {{ }} with the replaced content
    return `{{${replacedContent}}}`;
  });
}


function findUnusedName(names: string[], stepPrefix: string): string {
  let availableNumber = 1;
  let availableName = `${stepPrefix}_${availableNumber}`;

  while (names.includes(availableName)) {
    availableNumber++;
    availableName = `${stepPrefix}_${availableNumber}`;
  }

  return availableName;
}

function findAvailableStepName(flowVersion: FlowVersion, stepPrefix: string): string {
  const steps = flowHelper
    .getAllSteps(flowVersion.trigger)
    .map((f) => f.name);
  return findUnusedName(steps, stepPrefix);
}

export const flowHelper = {
  isValid: isValid,
  apply(
    flowVersion: FlowVersion,
    operation: FlowOperationRequest
  ): FlowVersion {
    let clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion));
    switch (operation.type) {
      case FlowOperationType.MOVE_ACTION:
        clonedVersion = moveAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.LOCK_FLOW:
        clonedVersion.state = FlowVersionState.LOCKED;
        break;
      case FlowOperationType.CHANGE_NAME:
        clonedVersion.displayName = operation.request.displayName;
        break;
      case FlowOperationType.DELETE_ACTION:
        clonedVersion = deleteAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.ADD_ACTION: {
        clonedVersion = transferFlow(
          addAction(clonedVersion, operation.request),
          (step) => upgradePiece(step, operation.request.action.name)
        );
        break;
      }
      case FlowOperationType.UPDATE_ACTION:
        clonedVersion = transferFlow(
          updateAction(clonedVersion, operation.request),
          (step) => upgradePiece(step, operation.request.name)
        );
        break;
      case FlowOperationType.UPDATE_TRIGGER:
        clonedVersion.trigger = createTrigger(
          clonedVersion.trigger.name,
          operation.request,
          clonedVersion.trigger.nextAction
        );
        clonedVersion = transferFlow(clonedVersion, (step) =>
          upgradePiece(step, operation.request.name)
        );
        break;
      case FlowOperationType.DUPLICATE_ACTION:
        {
          clonedVersion = duplicateStep(operation.request.stepName, clonedVersion);
        }
    }
    clonedVersion.valid = isValid(clonedVersion);
    return clonedVersion;
  },

  getStep,
  isAction,
  isTrigger,
  getAllSteps,
  getUsedPieces,
  getImportOperations,
  getAllSubFlowSteps,
  getStepFromSubFlow,
  isChildOf,
  transferFlowAsync,
  getAllChildSteps,
  getAllStepsAtFirstLevel,
  duplicateStep,
  findAvailableStepName
};
