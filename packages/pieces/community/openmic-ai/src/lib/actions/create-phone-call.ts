import { createAction, Property } from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const createPhoneCall = createAction({
  auth: openmicAiAuth,
  name: 'createPhoneCall',
  displayName: 'Create Phone Call',
  description: 'Create a new outbound phone call using OpenMic AI',
  props: {
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description: 'The number you own in E.164 format (e.g., +1234567890)',
      required: true,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description:
        'The number you want to call in E.164 format (e.g., +0987654321)',
      required: true,
    }),
    overrideAgentId: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The bot UID to override the default agent ',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Customer identifier for tracking ',
      required: false,
    }),
    dynamicVariables: Property.Object({
      displayName: 'Dynamic Variables',
      description: 'Key-value pairs to replace in the prompt',
      required: false,
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Callback URL to receive call events ',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      from_number: context.propsValue.fromNumber,
      to_number: context.propsValue.toNumber,
    };

    if (context.propsValue.overrideAgentId) {
      body['override_agent_id'] = context.propsValue.overrideAgentId;
    }

    if (context.propsValue.customerId) {
      body['customer_id'] = context.propsValue.customerId;
    }

    if (context.propsValue.dynamicVariables) {
      body['dynamic_variables'] = context.propsValue.dynamicVariables;
    }

    if (context.propsValue.callbackUrl) {
      body['callback_url'] = context.propsValue.callbackUrl;
    }

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/create-phone-call',
      body
    );

    return response.body;
  },
});
