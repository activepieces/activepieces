import crypto from 'crypto';

const KEY_LENGTH = 40;
const MAX_CUSTOM_KEY_LENGTH = 45;

function customKey({ value }: { value: unknown }): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_CUSTOM_KEY_LENGTH) {
    throw new Error(`Idempotency Key must be at most ${MAX_CUSTOM_KEY_LENGTH} characters.`);
  }
  return trimmed;
}

function key({ custom, runId, stepName, action, input }: { custom: unknown; runId: string | undefined; stepName: string | undefined; action: string; input: unknown }): string {
  const given = customKey({ value: custom });
  if (given !== null) {
    return given;
  }
  const seed = runId && runId.length > 0 ? `${runId}|${stepName ?? ''}` : crypto.randomUUID();
  return crypto.createHash('sha256').update(`${seed}|${action}|${canonical(input)}`).digest('hex').slice(0, KEY_LENGTH);
}

async function execute<T>({ context, action, input, send }: { context: IdempotencyContext; action: string; input: unknown; send: (params: { idempotencyKey: string }) => Promise<T> }): Promise<T> {
  const idempotencyKey = key({ custom: context.propsValue['idempotency_key'], runId: context.run?.id, stepName: context.step?.name, action, input });
  return send({ idempotencyKey });
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter((entry) => entry[1] !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export const squareIdempotency = { key, execute, customKey, canonical, MAX_CUSTOM_KEY_LENGTH };

type IdempotencyContext = {
  propsValue: Record<string, unknown>;
  run?: { id: string };
  step?: { name: string };
};
