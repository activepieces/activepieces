import { ActionType, TriggerType } from '@activepieces/shared';

function formatSampleData(sampleData: unknown, type: ActionType | TriggerType) {
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

export const testStepUtils = {
  formatSampleData,
  formatErrorMessage,
};
