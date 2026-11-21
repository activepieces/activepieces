function toEpochMs({ value, field }: { value: unknown; field: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  throw new Error(`${field} is not a valid date. Use an ISO date such as 2026-11-15T09:00:00Z.`);
}

export const sprinklrTime = {
  toEpochMs,
};
