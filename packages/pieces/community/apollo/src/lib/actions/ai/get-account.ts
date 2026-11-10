import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiGetAccountAction = createAction({
  auth: apolloAuth,
  name: 'ai_get_account',
  classification: 'READ',
  displayName: 'Get Account',
  description: 'Get one saved account by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one account (company saved in your Apollo CRM) by account ID, with domain, stage, owner, list IDs and custom fields. Uses no credits.',
    idempotent: true,
  },
  props: {
    account_id: aiProps.id({ displayName: 'Account ID', description: 'Account ID from Search Accounts (field id) or account_id from Search Organizations.' }),
  },
  outputSchema: apolloOutputSchemas.account,
  async run({ propsValue, auth }) {
    const accountId = apolloInputs.requireText({ value: propsValue.account_id, label: 'Account ID' });
    const body = await apolloRequests.getAccount({ apiKey: apiKeyOf(auth), accountId });
    return { account: apolloMappers.account(body['account']) };
  },
});
