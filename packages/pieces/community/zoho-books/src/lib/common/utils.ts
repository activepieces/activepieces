function toBoolean({ value }: { value: string | undefined }): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

function pageQuery({ page, perPage }: { page: number | undefined; perPage: number | undefined }): {
  page: number;
  per_page: number;
} {
  return {
    page: Math.max(Math.trunc(page ?? 1), 1),
    per_page: Math.min(Math.max(Math.trunc(perPage ?? MAX_PER_PAGE), 1), MAX_PER_PAGE),
  };
}

function toStringList({ value, propName }: { value: unknown[]; propName: string }): string[] {
  if (
    value.length === 0 ||
    !value.every((item): item is string => typeof item === 'string' && item !== '')
  ) {
    throw new Error(`${propName} must be a non-empty list of non-empty strings.`);
  }
  return value;
}

export const zohoBooksUtils = { toBoolean, pageQuery, toStringList };

const MAX_PER_PAGE = 200;
