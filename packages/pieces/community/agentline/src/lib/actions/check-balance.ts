import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const checkBalance = createAction({
  auth: agentlineAuth,
  name: 'check_balance',
  displayName: 'Check Balance',
  description: 'Check the current account balance and credits',
  audience: 'both',
  aiMetadata: {
    description:
      'Checks the current Agentline account balance. Returns the available credits. Calls cost $0.10/min and numbers cost $2.00 each.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.GET,
      '/v1/billing/balance',
    );
    return response.body;
  },
});
