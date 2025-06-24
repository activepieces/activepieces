function formatErrorMessage(errorMessage: string): string {
  const errorMessagesSplit = errorMessage.split('Error:');
  if (errorMessagesSplit.length < 2) {
    return errorMessage;
  }

  const filteredParts = errorMessagesSplit.filter((part) => part.trim() !== '');

  const indentationStep = '  ';
  return filteredParts.reduce((acc, current, index) => {
    const indentation = indentationStep.repeat(index);
    const cleanedPart = current.trim().replace(/^\n+|\n+$/g, '');
    const errorLabel =
      filteredParts.length === 1 ? 'Error' : `Error ${index + 1}`;
    return `${acc}${indentation}${errorLabel}: ${cleanedPart}\n`;
  }, '');
}

export const testStepUtils = {
  formatErrorMessage,
};
