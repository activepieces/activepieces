function formatErrorMessage(errorMessage: string): string {
  const errorMessagesSplit = errorMessage.split('Error:');
  if (errorMessagesSplit.length < 2) {
    return errorMessage;
  }

  const trimmedErrorMessages = errorMessagesSplit.filter((part) => part.trim() !== '');

  const indentationStep = '  ';
  return trimmedErrorMessages.reduce((acc, current, index) => {
    const indentation = indentationStep.repeat(index);
    const errorMessageWithoutEndlines = current.trim().replace(/^\n+|\n+$/g, '');
    const errorLabel =
    trimmedErrorMessages.length === 1 ? 'Error' : `Error ${index + 1}`;
    return `${acc}${indentation}${errorLabel}: ${errorMessageWithoutEndlines}\n`;
  }, '');
}

export const testStepUtils = {
  formatErrorMessage,
};
