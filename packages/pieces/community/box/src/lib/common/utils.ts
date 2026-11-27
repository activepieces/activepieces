function optionalString({ value }: { value?: number | boolean | null }): string | undefined {
  return value === undefined || value === null ? undefined : String(value);
}

function limitParam({ limit, max, fallback }: { limit?: number | null; max: number; fallback: number }): string {
  const value = limit === undefined || limit === null ? fallback : limit;
  return String(Math.min(Math.max(Math.trunc(value), 1), max));
}

export const boxUtils = { optionalString, limitParam };
