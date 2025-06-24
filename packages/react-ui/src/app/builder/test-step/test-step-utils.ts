function formatErrorMessage(errorMessage: string): string {
  const errorMessagesSplit = errorMessage.split('Error:');
  if (errorMessagesSplit.length < 2) {
    return errorMessage;
  }

  // Remove empty lines and trim whitespace
  const cleanedErrorMessages = errorMessagesSplit
    .map((message) => message.trim().replace(/^\n+|\n+$/g, ''))
    .filter((message) => message !== '');

  const indentationStep = '  ';
  return cleanedErrorMessages.reduce((acc, current, index) => {
    const indentation = indentationStep.repeat(index);
    const errorLabel =
      cleanedErrorMessages.length === 1 ? 'Error' : `Error ${index + 1}`;
    return `${acc}${indentation}${errorLabel}: ${current}\n`;
  }, '');
}

export const testStepUtils = {
  formatErrorMessage,
};
