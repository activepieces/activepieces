function parseBoolean({ value }: { value: string | undefined }): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (value !== 'true' && value !== 'false') {
    throw new Error(`Expected "true" or "false", got "${value}".`);
  }
  return value === 'true';
}

function paging({
  page,
  perPage,
}: {
  page: number | undefined;
  perPage: number | undefined;
}): Record<string, string> {
  return {
    page: String(page ?? 0),
    per_page: String(Math.min(Math.max(perPage ?? DEFAULT_PER_PAGE, 1), MAX_PER_PAGE)),
  };
}

export const mattermostUtils = { parseBoolean, paging };

const DEFAULT_PER_PAGE = 60;
const MAX_PER_PAGE = 200;
