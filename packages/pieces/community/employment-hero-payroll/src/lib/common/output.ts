import { PayrollRecord } from './client';

function flatten(record: PayrollRecord): FlatRecord {
  return Object.fromEntries(
    Object.entries(record).flatMap(([key, value]) => {
      if (Array.isArray(value)) return [[key, JSON.stringify(value)]];
      if (value !== null && typeof value === 'object') {
        return Object.entries(flatten(value)).map(([child, item]) => [
          `${key}_${child}`,
          item,
        ]);
      }
      return [[key, value]];
    })
  );
}

function rows(records: PayrollRecord[]) {
  const flattened = records.map(flatten);
  const keys = [...new Set(flattened.flatMap((record) => Object.keys(record)))];
  return flattened.map((record) =>
    Object.fromEntries(keys.map((key) => [key, record[key] ?? null]))
  );
}

export const payrollOutput = { flatten, rows };
type FlatRecord = Record<string, string | number | boolean | null>;
