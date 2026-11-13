function pageQuery({ page, perPage, sort, filter }: { page?: number; perPage?: number; sort?: string; filter?: string }): Record<string, string> {
  return {
    page: String(page ?? 1),
    perPage: String(Math.min(Math.max(perPage ?? DEFAULT_PER_PAGE, 1), MAX_PER_PAGE)),
    ...(sort ? { sort } : {}),
    ...(filter ? { filter } : {}),
  };
}

export const pocketbaseUtils = { pageQuery };

const DEFAULT_PER_PAGE = 30;
const MAX_PER_PAGE = 1000;
