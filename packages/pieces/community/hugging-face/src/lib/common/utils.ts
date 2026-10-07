function truncateText({ text, maxChars }: TruncateTextParams): TruncatedText {
  if (text.length <= maxChars) {
    return { text, truncated: false, originalLength: text.length };
  }
  return { text: text.slice(0, maxChars), truncated: true, originalLength: text.length };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

function assertLimit({ value, min, max, name }: AssertLimitParams): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be a whole number between ${min} and ${max}.`);
  }
}

function booleanFlag(value: string | undefined): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

export const hfUtils = {
  truncateText,
  toStringArray,
  assertLimit,
  booleanFlag,
};

type TruncateTextParams = {
  text: string;
  maxChars: number;
};

type TruncatedText = {
  text: string;
  truncated: boolean;
  originalLength: number;
};

type AssertLimitParams = {
  value: number | undefined;
  min: number;
  max: number;
  name: string;
};
