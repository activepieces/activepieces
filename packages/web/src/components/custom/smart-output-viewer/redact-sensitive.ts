import { isNil, isObject } from '@activepieces/core-utils';

import { OutputSchema } from './types';

function redactObject(
  obj: Record<string, unknown>,
  sensitiveKeys: string[],
): Record<string, unknown> {
  const copy = { ...obj };
  for (const key of sensitiveKeys) {
    if (key in copy) {
      copy[key] = REDACTED_DISPLAY_VALUE;
    }
  }
  return copy;
}

// Display-time masking only: the real value stays in the store so downstream
// steps still resolve it. We blank the top-level keys a piece marked
// `sensitive` in its outputSchema, matching the engine's log-boundary redaction.
function redactSensitiveOutput(
  json: unknown,
  schema: OutputSchema | null | undefined,
): unknown {
  if (isNil(schema)) {
    return json;
  }
  const sensitiveKeys = schema.fields
    .filter((field) => field.sensitive)
    .map((field) => field.value ?? field.key);
  if (sensitiveKeys.length === 0) {
    return json;
  }
  if (Array.isArray(json)) {
    return json.map((item) =>
      isObject(item) ? redactObject(item, sensitiveKeys) : item,
    );
  }
  if (isObject(json)) {
    return redactObject(json, sensitiveKeys);
  }
  return json;
}

export const REDACTED_DISPLAY_VALUE = '**REDACTED**';
export const sensitiveOutputUtils = { redactSensitiveOutput };
