function pageSize({ limit }: { limit: number | undefined }): number {
  const value = limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Limit must be a whole number of at least 1.');
  }
  return Math.min(value, MAX_LIMIT);
}

function offset({ skip }: { skip: number | undefined }): number | undefined {
  if (skip === undefined || skip === null) {
    return undefined;
  }
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error('Skip must be a whole number of 0 or more.');
  }
  return skip;
}

function booleanChoice({
  value,
  propName,
}: {
  value: string | undefined;
  propName: string;
}): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${propName} must be "true" or "false".`);
  }
  return value === 'true';
}

export const microsoftOneNoteUtils = { pageSize, offset, booleanChoice };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
