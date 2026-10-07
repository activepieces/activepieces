import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { accountOutputSchema } from '../../output-schemas';

export const getAccountAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_get_account',
  classification: 'READ',
  displayName: 'Get CRM Account',
  description: 'Gets a CRM contact or organization by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Flowlu CRM account (contact or organization: names, phones, website, owner, category, addresses) by its numeric account_id. Use to read an account before updating it or linking it; use flowlu_find_accounts to look one up by name or email. Fails if the account does not exist. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Numeric ID of the contact or organization, such as "42". Map it from an earlier step or from Find CRM Accounts.',
      required: true,
    }),
  },
  outputSchema: accountOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.account_id,
      name: 'Account ID',
    });
    return makeClient(context.auth).getRecord('crm', 'account', id);
  },
});
