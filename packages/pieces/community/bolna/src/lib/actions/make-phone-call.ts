import { createAction, Property } from '@activepieces/pieces-framework';
import { bolnaaiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentId } from '../common/props';

export const makePhoneCall = createAction({
  auth: bolnaaiAuth,
  name: 'makePhoneCall',
  displayName: 'Make Phone Call',
  description:
    'Initiate an outbound phone call from a Bolna Voice AI agent to a recipient.',
  props: {
    agentId: agentId,
    recipientPhoneNumber: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'Phone number of the recipient with country code (E.164 format, e.g., +10123456789)',
      required: true,
    }),
    fromPhoneNumber: Property.ShortText({
      displayName: 'From Phone Number',
      description:
        'Phone number of the sender with country code (E.164 format, e.g., +19876543007). Optional.',
      required: false,
    }),
    scheduledAt: Property.ShortText({
      displayName: 'Scheduled At',
      description:
        'The scheduled date and time in ISO 8601 format with time zone (e.g., 2025-08-21T10:35:00Z). Leave empty to call immediately.',
      required: false,
    }),
    userData: Property.Json({
      displayName: 'User Data',
      description:
        'Additional user dynamic variables as defined in the agent prompt (JSON object)',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const payload: Record<string, unknown> = {
      agent_id: context.propsValue.agentId,
      recipient_phone_number: context.propsValue.recipientPhoneNumber,
    };

    if (context.propsValue.fromPhoneNumber) {
      payload['from_phone_number'] = context.propsValue.fromPhoneNumber;
    }

    if (context.propsValue.scheduledAt) {
      payload['scheduled_at'] = context.propsValue.scheduledAt;
    }

    if (context.propsValue.userData) {
      payload['user_data'] = context.propsValue.userData;
    }

    const response = await makeRequest(auth, HttpMethod.POST, '/call', payload);
    return response;
  },
});
