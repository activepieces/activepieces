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
const cleanResponse = (response: unknown): unknown => {
  if (Number.isNaN(response)) {
    return 'NaN';
  }
  if (response === null) {
    return 'null';
  }
  if (response === undefined) {
    return 'undefined';
  }
  if (response === 0) {
    return '0';
  }
  if (response === false) {
    return 'false';
  }
  return response;
};
export const testStepUtils = {
  formatErrorMessage,
  cleanResponse,
};
