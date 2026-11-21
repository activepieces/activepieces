import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiProps } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

async function queryCalls({
  apiKey,
  assistantId,
  phoneNumberId,
  createdAfter,
  createdBefore,
  limit,
}: {
  apiKey: string;
  assistantId?: string;
  phoneNumberId?: string;
  createdAfter?: string;
  createdBefore?: string;
  limit: number;
}): Promise<Record<string, unknown>[]> {
  const response = await vapiApi.request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: '/call',
    operation: 'list calls',
    query: {
      assistantId: assistantId?.trim(),
      phoneNumberId: phoneNumberId?.trim(),
      createdAtGt: normalizeDate({ value: createdAfter, fieldName: 'Created After' }),
      createdAtLt: normalizeDate({ value: createdBefore, fieldName: 'Created Before' }),
      limit,
    },
  });
  return vapiUtils.asArray(response).map((call) => vapiUtils.cleanCall(call));
}

function normalizeDate({ value, fieldName }: { value: string | undefined; fieldName: string }): string | undefined {
  if (value === undefined || value === null || value.trim() === '') {
    return undefined;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid date, e.g. 2026-01-31T00:00:00Z.`);
  }
  return new Date(parsed).toISOString();
}

export const listCalls = createAction({
  auth: vapiAuth,
  name: 'list_calls',
  classification: 'SEARCH',
  displayName: 'List Calls',
  description: 'List recent calls, newest first, optionally filtered by assistant, phone number and creation date.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.listCalls,
  props: {
    assistantId: vapiProps.assistantDropdown({ required: false, description: 'Only calls handled by this assistant.' }),
    phoneNumberId: vapiProps.phoneNumberDropdown({ required: false, description: 'Only calls on this phone number.' }),
    createdAfter: Property.DateTime({ displayName: 'Created After', required: false }),
    createdBefore: Property.DateTime({ displayName: 'Created Before', required: false }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of calls to return (1-1000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { assistantId, phoneNumberId, createdAfter, createdBefore, limit } = context.propsValue;
    const calls = await queryCalls({
      apiKey: context.auth.secret_text,
      assistantId: assistantId ?? undefined,
      phoneNumberId: phoneNumberId ?? undefined,
      createdAfter: createdAfter ?? undefined,
      createdBefore: createdBefore ?? undefined,
      limit: vapiUtils.clampLimit({ value: limit, defaultValue: 100, max: 1000 }),
    });
    return { calls };
  },
});

export const callQuery = { query: queryCalls, normalizeDate };
