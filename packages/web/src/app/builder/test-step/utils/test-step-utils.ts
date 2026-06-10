function formatErrorMessage(errorMessage: string): string {
  const errorMessages = errorMessage.split('Error:');
  if (errorMessages.length < 2) {
    return errorMessage;
  }

  const errorMessagesWithoutWhiteSpaces = errorMessages
    .map((message) => message.trim().replace(/^\n+|\n+$/g, ''))
    .filter((message) => message !== '');

  const indentationStep = '  ';
  return errorMessagesWithoutWhiteSpaces.reduce((acc, current, index) => {
    const indentation = indentationStep.repeat(index);
    const errorLabel =
      errorMessagesWithoutWhiteSpaces.length === 1
        ? 'Error'
        : `Error ${index + 1}`;
    return `${acc}${indentation}${errorLabel}: ${current}\n`;
  }, '');
}

export const testStepUtils = {
  formatErrorMessage,
};
