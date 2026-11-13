function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function record(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function textList(value: unknown): string[] {
  return list(value).filter((entry): entry is string => typeof entry === 'string');
}

function numberList(value: unknown): number[] {
  return list(value).filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry));
}

function parseJsonText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export const datalabGuards = { isRecord, text, finiteNumber, list, record, textList, numberList, parseJsonText };
