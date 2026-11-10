import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiUpdateAccountAction = createAction({
  auth: apolloAuth,
  name: 'ai_update_account',
  classification: 'WRITE',
  displayName: 'Update Account',
  description: 'Change fields on a saved account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one account in your Apollo CRM by account ID; only the fields you give are sent and the rest keep their value. Change the stage with account_stage_id and the owner with owner_id. Uses no credits.',
    idempotent: true,
  },
  props: {
    account_id: aiProps.id({ displayName: 'Account ID', description: 'Account ID from Search Accounts (field id).' }),
    name: aiProps.text({ displayName: 'Company Name', description: 'New name.', required: false }),
    domain: aiProps.text({ displayName: 'Domain', description: 'New domain.', required: false }),
    owner_id: aiProps.optionalId({ displayName: 'Owner User ID', description: 'User ID from List Users (field id).' }),
    account_stage_id: aiProps.optionalId({ displayName: 'Account Stage ID', description: 'Stage ID from List Account Stages (field id).' }),
    phone: aiProps.text({ displayName: 'Phone', description: 'New phone.', required: false }),
    raw_address: aiProps.text({ displayName: 'Address', description: 'New address.', required: false }),
    typed_custom_fields: aiProps.typedCustomFields({ modality: 'account' }),
  },
  outputSchema: apolloOutputSchemas.account,
  async run({ propsValue, auth }) {
    const accountId = apolloInputs.requireText({ value: propsValue.account_id, label: 'Account ID' });
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
      throw new Error('Give at least one field to change.');
    }
    const response = await apolloRequests.updateAccount({ apiKey: apiKeyOf(auth), accountId, body });
    return { account: apolloMappers.account(response['account']) };
  },
});
