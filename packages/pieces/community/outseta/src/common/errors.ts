function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const response = (error as { response?: { status?: number } }).response;
  return response?.status === 404;
}

export const outsetaErrors = { isNotFound };
