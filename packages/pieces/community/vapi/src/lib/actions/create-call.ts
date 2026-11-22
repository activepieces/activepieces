import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

async function startCall({
  apiKey,
  assistantId,
  phoneNumberId,
  customer,
  name,
  assistantOverrides,
}: {
  apiKey: string;
  assistantId: string;
  phoneNumberId: string;
  customer: Record<string, string>;
  name?: string;
  assistantOverrides?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    assistantId: assistantId.trim(),
    phoneNumberId: phoneNumberId.trim(),
    customer,
  };
  if (name !== undefined && name !== '') {
    body['name'] = name;
  }
  if (assistantOverrides !== undefined) {
    body['assistantOverrides'] = assistantOverrides;
  }
  const call = await vapiApi.request<unknown>({
    apiKey,
    method: HttpMethod.POST,
    path: '/call',
    operation: 'create call',
    body,
  });
  return vapiUtils.cleanCall(call);
}

export const createCall = createAction({
  auth: vapiAuth,
  name: 'create_call',
  classification: 'WRITE',
  displayName: 'Create Call',
  description: 'Create an outbound phone call using a Vapi assistant.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.call,
  props: {
    assistantId: Property.ShortText({
      displayName: 'Assistant ID',
      description: 'The ID of the Vapi assistant that will handle the call. Get this from your Vapi Dashboard.',
      required: true,
    }),
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'The ID of the phone number to make the call from. Must be a number registered in your Vapi account.',
      required: true,
    }),
    customerNumber: Property.ShortText({
      displayName: 'Customer Phone Number',
      description: 'The phone number to call, in E.164 format (e.g. +14155551234).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Call Name',
      description: 'An optional name for this call for identification.',
      required: false,
    }),
    assistantOverrides: Property.Json({
      displayName: 'Assistant Overrides',
      description:
        'Optional JSON object with assistant configuration overrides for this call (e.g. first message, model settings).',
      required: false,
    }),
  },
  async run(context) {
    const { assistantId, phoneNumberId, customerNumber, name, assistantOverrides } = context.propsValue;
    return startCall({
      apiKey: context.auth.secret_text,
      assistantId,
      phoneNumberId,
      customer: { number: customerNumber.trim() },
      name: name ?? undefined,
      assistantOverrides: vapiUtils.parseJsonObject({ value: assistantOverrides, fieldName: 'Assistant Overrides' }),
    });
  },
});

export const callStarter = { start: startCall };
