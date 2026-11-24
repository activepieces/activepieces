function toQuery({
  params,
}: {
  params: Record<string, string | number | undefined>;
}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(
        (entry): entry is [string, string | number] => entry[1] !== undefined
      )
      .map(([key, value]) => [key, String(value)])
  );
}

function clampLimit({
  limit,
  max,
}: {
  limit: number | undefined;
  max: number;
}): number {
  return Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), max);
}

export const perplexityAiUtils = { toQuery, clampLimit };

const DEFAULT_LIMIT = 20;
