import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const listNumbers = createAction({
  auth: agentlineAuth,
  name: 'list_numbers',
  displayName: 'List Phone Numbers',
  description: 'List all provisioned phone numbers on your account',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all phone numbers provisioned on the Agentline account, including their assigned agents and statuses.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await agentlineApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      '/v1/numbers',
    );
    return response.body;
  },
});
