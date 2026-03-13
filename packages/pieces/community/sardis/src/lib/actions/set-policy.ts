import { createAction, Property } from '@activepieces/pieces-framework';
import { sardisAuth } from '../..';
import { sardisCommon, makeSardisClient } from '../common';

export const sardisSetPolicy = createAction({
  name: 'set_policy',
  auth: sardisAuth,
  displayName: 'Set Spending Policy',
  description:
    'Set or update the spending policy on a wallet using natural language. Examples: "Max $50 per transaction", "Daily limit $500", "Only allow payments to openai.com and anthropic.com".',
  props: {
    walletId: sardisCommon.walletId,
    policyText: Property.LongText({
      displayName: 'Policy (Natural Language)',
      description:
        'Describe the spending rules in plain English. e.g. "Max $50 per transaction, daily limit $500, block gambling merchants"',
      required: true,
    }),
  },
  async run(context) {
    const { walletId, policyText } = context.propsValue;
    const client = makeSardisClient(context.auth.secret_text);

    return await client.policies.apply(policyText, walletId);
  },
});
