export function formatErrorMessage(
  errorMessage: string,
  tokens: Record<string, any>
): string {
  let formattedMessage = errorMessage;
  for (const key in tokens) {
    formattedMessage = formattedMessage.replace(`{${key}}`, tokens[key]);
  }
  return formattedMessage;
}
