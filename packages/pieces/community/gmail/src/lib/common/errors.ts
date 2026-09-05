export function getGmailApiErrorCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error;
    if (typeof code === 'number') {
      return code;
    }
  }
  return undefined;
}

export function getGmailApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
