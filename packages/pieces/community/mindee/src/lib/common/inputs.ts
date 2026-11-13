function positiveInt({ value, fallback, max }: { value: number | undefined | null; fallback: number; max: number }): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.trunc(value), 1), max);
}

export const mindeeInputs = { positiveInt };
