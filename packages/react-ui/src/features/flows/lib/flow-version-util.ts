import dayjs from 'dayjs';

import {
  Action,
  ActionErrorHandlingOptions,
  ActionType,
  BranchAction,
  BranchCondition,
  CodeAction,
  LoopOnItemsAction,
  SourceCode,
  Trigger,
} from '@activepieces/shared';

function formatSampleData(sampleData: unknown, type: ActionType) {
  if (sampleData === undefined) {
    return 'undefined';
  }
  const shouldRemoveIterations =
    type === ActionType.LOOP_ON_ITEMS &&
    sampleData &&
    typeof sampleData === 'object' &&
    'iterations' in sampleData;
  if (shouldRemoveIterations) {
    delete sampleData.iterations;
  }
  return sampleData;
}

function buildActionWithSampleData(
  selectedStep: Action,
  sampleData: unknown,
): Action {
  const clonedAction: Action = JSON.parse(JSON.stringify(selectedStep));
  clonedAction.settings.inputUiInfo = {
    ...selectedStep.settings.inputUiInfo,
    currentSelectedData: formatSampleData(sampleData, selectedStep.type),
    lastTestDate: dayjs().toISOString(),
  };
  return clonedAction;
}

function buildActionWithBranchCondition(
  selectedStep: BranchAction,
  conditions: BranchCondition[][],
  valid: boolean,
): BranchAction {
  const clonedAction: BranchAction = JSON.parse(JSON.stringify(selectedStep));
  clonedAction.settings = {
    ...clonedAction.settings,
    conditions,
  };
  clonedAction.valid = valid;
  return clonedAction;
}

function buildActionWithNewCode(
  selectedStep: CodeAction,
  sourceCode: SourceCode,
  input: Record<string, string>,
): CodeAction {
  const clonedAction: CodeAction = JSON.parse(JSON.stringify(selectedStep));
  clonedAction.settings.sourceCode = sourceCode;
  clonedAction.settings.input = input;
  return clonedAction;
}

function buildActionWithNewLoopItems(
  selectedStep: LoopOnItemsAction,
  items: string,
  valid: boolean,
): LoopOnItemsAction {
  const clonedAction: LoopOnItemsAction = JSON.parse(
    JSON.stringify(selectedStep),
  );
  clonedAction.settings.items = items;
  clonedAction.valid = valid;
  return clonedAction;
}

function buildActionWithErrorOptions<T extends Action | Trigger>(
  selectedStep: T,
  {
    continueOnFailure,
    retryOnFailure,
  }: {
    continueOnFailure: boolean | undefined;
    retryOnFailure: boolean | undefined;
  },
): Action {
  const clonedAction: T = JSON.parse(JSON.stringify(selectedStep));
  switch (clonedAction.type) {
    case ActionType.PIECE:
    case ActionType.CODE: {
      const errorHandlingOptions: ActionErrorHandlingOptions = {
        continueOnFailure: {
          value:
            continueOnFailure ??
            clonedAction.settings.errorHandlingOptions?.continueOnFailure
              ?.value ??
            false,
        },
        retryOnFailure: {
          value:
            retryOnFailure ??
            clonedAction.settings.errorHandlingOptions?.retryOnFailure?.value ??
            false,
        },
      };
      clonedAction.settings.errorHandlingOptions = errorHandlingOptions;
      return clonedAction;
    }
    default: {
      throw new Error(
        `Action type ${selectedStep.type} should not have error handling options`,
      );
    }
  }
}

function formatErrorMessage(errorMessage: string): string {
  const errorMessagesSplit = errorMessage.split('Error:');
  if (errorMessagesSplit.length < 2) {
    return errorMessage;
  }

  const indentationStep = '  ';
  return errorMessagesSplit.reduce((acc, current, index) => {
    const indentation = indentationStep.repeat(index);
    return `${acc}${indentation}Error ${index + 1}: ${current.trim()}\n`;
  }, '');
}

export const flowVersionUtils = {
  buildActionWithSampleData,
  buildActionWithErrorOptions,
  buildActionWithNewCode,
  formatErrorMessage,
  buildActionWithNewLoopItems,
  buildActionWithBranchCondition,
};
