import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisApiCall } from '../common';

export const setSpendingPolicyAction = createAction({
  name: 'set_policy',
  auth: sardisAuth,
  displayName: 'Set Spending Policy',
  description: 'Set or update spending policies on a Sardis agent using natural language.',
  props: {
    agentId: Property.ShortText({
      displayName: 'Agent ID',
      description: 'Your Sardis agent ID',
      required: true,
    }),
    policyText: Property.LongText({
      displayName: 'Policy (Natural Language)',
      description:
        'Describe the spending rules in plain English. e.g. "Max $50 per transaction, daily limit $500, block gambling merchants"',
      required: true,
    }),
  },
  async run(context) {
    const { agentId, policyText } = context.propsValue;
    return sardisApiCall(
      context.auth.secret_text,
      HttpMethod.POST,
      '/api/v2/policies/apply',
      { natural_language: policyText, agent_id: agentId, confirm: true },
    );
  },
});
