import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth, retellAiApi } from '../common';

export const createPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'create_phone_number',
  displayName: 'Create a Phone Number',
  description: 'Buy a new phone number and bind agents',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to purchase (e.g., +12137771234)',
      required: true,
    }),
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The agent ID to bind to this phone number',
      required: true,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata for the phone number',
      required: false,
    }),
  },
  async run(context) {
    const { phone_number, agent_id, metadata } = context.propsValue;

    const payload = {
      phone_number,
      agent_id,
      ...(metadata && { metadata }),
    };

    const response = await retellAiApi.post('/v2/create-phone-number', context.auth, payload);
    return response;
  },
});
