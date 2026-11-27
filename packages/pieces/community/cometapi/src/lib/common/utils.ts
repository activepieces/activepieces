import type { CometApiMinimaxResponse } from './types';

function assertMinimaxSucceeded({
  response,
}: {
  response: CometApiMinimaxResponse;
}): void {
  const statusCode = response.base_resp?.status_code;
  if (statusCode !== undefined && statusCode !== 0) {
    throw new Error(
      `MiniMax rejected the request (${statusCode}): ${response.base_resp?.status_msg}`
    );
  }
}

function withAdditionalFields({
  additionalFields,
  fields,
}: {
  additionalFields?: Record<string, unknown>;
  fields: Record<string, unknown>;
}): Record<string, unknown> {
  const defined = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
  return { ...additionalFields, ...defined };
}

function toBoolean({
  value,
}: {
  value: string | undefined;
}): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

function toOptions({ values }: { values: readonly string[] }) {
  return values.map((value) => ({ label: value, value }));
}

export const cometApiUtils = {
  assertMinimaxSucceeded,
  withAdditionalFields,
  toBoolean,
  toOptions,
};
