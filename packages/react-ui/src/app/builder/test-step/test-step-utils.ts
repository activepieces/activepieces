function formatErrorMessage(errorMessage: string): string {
  const errorMessagesSplit = errorMessage.split('Error:');
  if (errorMessagesSplit.length < 2) {
    return errorMessage;
  }

  // Remove empty lines and trim whitespace
  const trimmedErrorMessages = errorMessagesSplit
    .map((message) => message.trim().replace(/^\n+|\n+$/g, ''))
    .filter((message) => message !== '');

  const indentationStep = '  ';
  return trimmedErrorMessages.reduce((acc, current, index) => {
    const indentation = indentationStep.repeat(index);
    const errorLabel =
      trimmedErrorMessages.length === 1 ? 'Error' : `Error ${index + 1}`;
    return `${acc}${indentation}${errorLabel}: ${current}\n`;
  }, '');
}

export const testStepUtils = {
  formatErrorMessage,
};
