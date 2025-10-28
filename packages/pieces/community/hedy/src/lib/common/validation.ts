export function assertLimit(limit?: number): number | undefined {
  if (limit === undefined || limit === null) {
    return limit ?? undefined;
  }

  if (Number.isNaN(limit)) {
    throw new Error('Limit must be a number between 1 and 100.');
  }

  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100.');
  }

  return limit;
}
