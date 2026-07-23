import { isObject } from '@activepieces/core-utils';

const TRUNCATED_INPUT_PLACEHOLDER_REGEX =
  /^\(truncated(, original size \d+(\.\d+)? (KB|MB))?\)$/;

function hasTruncatedValues(input: unknown): boolean {
  return (
    isObject(input) &&
    Object.values(input).some(
      (value) =>
        typeof value === 'string' &&
        TRUNCATED_INPUT_PLACEHOLDER_REGEX.test(value),
    )
  );
}

export const truncatedInputUtils = { hasTruncatedValues };
