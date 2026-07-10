import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisApiCall } from '../common';

export const setSpendingPolicyAction = createAction({
  name: 'set_policy',
  auth: sardisAuth,
  displayName: 'Set Spending Policy',
  description: 'Set or update spending policies on a Sardis agent using natural language.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets or replaces the spending policy on a Sardis agent from a plain-English description of the rules (e.g. per-transaction caps, daily limits, blocked merchant categories). Use it to configure how an agent is allowed to spend before it sends payments. Idempotent in effect — re-applying the same policy text to the same agent yields the same resulting policy. Requires the agent ID and the natural-language policy text.',
    idempotent: true,
  },
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
