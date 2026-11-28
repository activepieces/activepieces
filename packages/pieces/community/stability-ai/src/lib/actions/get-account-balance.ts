import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { accountBalanceOutputSchema } from '../common/output-schemas';

export const getAccountBalance = createAction({
  auth: stabilityAiAuth,
  name: 'get_account_balance',
  classification: 'READ',
  displayName: 'Get Account Balance',
  description: 'Get the number of credits left on the Stability AI account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns how many Stability AI credits the connected account has left (1 credit = $0.01). Use before costly generations to check there is enough balance. Free and safe to repeat.',
    idempotent: true,
  },
  props: {},
  outputSchema: accountBalanceOutputSchema,
  async run(context) {
    const body = await stabilityClient.sendJson<{ credits?: unknown }>({
      apiKey: context.auth.props.api_key,
      method: HttpMethod.GET,
      path: '/v1/user/balance',
    });
    if (typeof body?.credits !== 'number') {
      throw new Error('Stability AI returned a balance without a credits value.');
    }
    return { credits: body.credits };
  },
});
