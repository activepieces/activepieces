function definedQuery({
  query,
}: {
  query: Record<string, string | undefined>;
}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
}

function pageQuery({
  page,
  limit,
}: {
  page: number | undefined;
  limit: number | undefined;
}): Record<string, string> {
  return definedQuery({
    query: {
      page: page === undefined ? undefined : String(page),
      page_size: String(
        Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)
      ),
    },
  });
}

function mailboxBody({
  additionalFields,
  settings,
}: {
  additionalFields: unknown;
  settings: Record<string, unknown>;
}): Record<string, unknown> {
  if (
    additionalFields !== undefined &&
    additionalFields !== null &&
    (typeof additionalFields !== 'object' || Array.isArray(additionalFields))
  ) {
    throw new Error('Additional Settings must be a JSON object.');
  }
  const extra = additionalFields ?? {};
  const set = Object.entries(settings).filter(
    ([, value]) => value !== undefined
  );
  return { ...extra, ...Object.fromEntries(set) };
}

export const parseurUtils = { definedQuery, pageQuery, mailboxBody };

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
