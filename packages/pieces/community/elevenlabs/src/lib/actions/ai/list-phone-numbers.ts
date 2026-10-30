import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListPhoneNumbersOutputSchema } from '../../output-schemas';

export const listPhoneNumbers = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_phone_numbers',
  outputSchema: elevenlabsListPhoneNumbersOutputSchema,
  displayName: 'List Phone Numbers',
  description: 'List agent phone numbers',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists imported phone numbers with the agent each is assigned to. The phone_number_id feeds Make Outbound Call and Submit Batch Call.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'Only numbers assigned to this agent', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/phone-numbers`,
      queryParams: { agent_id: propsValue.agentId },
    });
    return { items: response, count: response.length };
  },
});
