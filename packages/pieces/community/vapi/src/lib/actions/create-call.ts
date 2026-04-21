import { createAction, Property } from '@activepieces/pieces-framework';
import { Vapi } from '@vapi-ai/server-sdk';
import { vapiAuth } from '../auth';
import { createVapiClient } from '../common/client';

export const createCall = createAction({
  auth: vapiAuth,
  name: 'create_call',
  displayName: 'Create Call',
  description: 'Create an outbound phone call using a Vapi assistant.',
  props: {
    assistantId: Property.ShortText({
      displayName: 'Assistant ID',
      description:
        'The ID of the Vapi assistant that will handle the call. Get this from your Vapi Dashboard.',
      required: true,
    }),
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description:
        'The ID of the phone number to make the call from. Must be a number registered in your Vapi account.',
      required: true,
    }),
    customerNumber: Property.ShortText({
      displayName: 'Customer Phone Number',
      description:
        'The phone number to call, in E.164 format (e.g. +14155551234).',
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
    const client = createVapiClient(context.auth.secret_text);
    const { assistantId, phoneNumberId, customerNumber, name, assistantOverrides } =
      context.propsValue;

    const request: Vapi.CreateCallDto = {
      assistantId,
      phoneNumberId,
      customer: { number: customerNumber },
    };

    if (name) request.name = name;
    if (assistantOverrides) {
      request.assistantOverrides = assistantOverrides as Vapi.AssistantOverrides;
    }

    const call = await client.calls.create(request);
    return call;
  },
});
