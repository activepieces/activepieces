import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiCreateAccountAction = createAction({
  auth: apolloAuth,
  name: 'ai_create_account',
  classification: 'WRITE',
  displayName: 'Create Account',
  description: 'Save a company as an account in Apollo.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Saves a company as an account in your Apollo CRM from a name and/or domain, with optional owner, stage, phone, address and custom fields. Apollo never deduplicates accounts, so run Search Accounts first; every call creates a new account. Uses no credits.',
    idempotent: false,
  },
  props: {
    name: aiProps.text({ displayName: 'Company Name', description: 'Company name (name or domain is required).', required: false }),
    domain: aiProps.text({ displayName: 'Domain', description: 'Company domain without "www.", e.g. example.com.', required: false }),
    owner_id: aiProps.optionalId({ displayName: 'Owner User ID', description: 'User ID from List Users or Get Credit Usage (field user_id).' }),
    account_stage_id: aiProps.optionalId({ displayName: 'Account Stage ID', description: 'Stage ID from List Account Stages (field id).' }),
    phone: aiProps.text({ displayName: 'Phone', description: 'Main phone number.', required: false }),
    raw_address: aiProps.text({ displayName: 'Address', description: 'Company location, e.g. "Austin, Texas".', required: false }),
    typed_custom_fields: aiProps.typedCustomFields({ modality: 'account' }),
  },
  outputSchema: apolloOutputSchemas.account,
  async run({ propsValue, auth }) {
    const body = apolloInputs.compact({
      name: apolloInputs.optionalText(propsValue.name),
      domain: apolloInputs.optionalText(propsValue.domain),
      owner_id: apolloInputs.optionalText(propsValue.owner_id),
      account_stage_id: apolloInputs.optionalText(propsValue.account_stage_id),
      phone: apolloInputs.optionalText(propsValue.phone),
      raw_address: apolloInputs.optionalText(propsValue.raw_address),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
    });
    if (body['name'] === undefined && body['domain'] === undefined) {
      throw new Error('Give a company name or a domain.');
    }
    const response = await apolloRequests.createAccount({ apiKey: apiKeyOf(auth), body });
    return { account: apolloMappers.account(response['account']) };
  },
});
