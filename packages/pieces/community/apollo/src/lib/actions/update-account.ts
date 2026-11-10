import { Property, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloProps } from '../common/props';
import { apolloMappers, apolloRequests } from '../common/requests';

export const updateAccountAction = createAction({
  auth: apolloAuth,
  name: 'update_account',
  classification: 'WRITE',
  displayName: 'Update Account',
  description: 'Change fields on an existing Apollo account. Empty fields are left unchanged.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the fields you fill in on one Apollo account picked from a dropdown; empty fields are not sent and keep their saved value. Uses no credits.',
    idempotent: true,
  },
  props: {
    account_id: apolloProps.account({ required: true, description: 'Account to update. Type to search, or map an account ID.' }),
    name: Property.ShortText({ displayName: 'Company Name', required: false }),
    domain: Property.ShortText({ displayName: 'Domain', required: false }),
    owner_id: apolloProps.owner({ displayName: 'Owner', description: 'Apollo user who owns the account.', required: false }),
    account_stage_id: apolloProps.accountStage({ required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    raw_address: Property.ShortText({ displayName: 'Address', required: false }),
    typed_custom_fields: apolloProps.customFields({ modality: 'account' }),
  },
  outputSchema: apolloOutputSchemas.humanAccount,
  async run({ propsValue, auth }) {
    const accountId = apolloInputs.requireText({ value: propsValue.account_id, label: 'Account' });
    const body = apolloInputs.compact({
      name: apolloInputs.optionalText(propsValue.name),
      domain: apolloInputs.optionalText(propsValue.domain),
      owner_id: apolloInputs.optionalText(propsValue.owner_id),
      account_stage_id: apolloInputs.optionalText(propsValue.account_stage_id),
      phone: apolloInputs.optionalText(propsValue.phone),
      raw_address: apolloInputs.optionalText(propsValue.raw_address),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Fill in at least one field to update.');
    }
    const response = await apolloRequests.updateAccount({ apiKey: apiKeyOf(auth), accountId, body });
    return { account: apolloMappers.account(response['account']) };
  },
});
