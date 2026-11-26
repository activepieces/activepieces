import { Property, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloProps } from '../common/props';
import { apolloMappers, apolloRequests } from '../common/requests';

export const createAccountAction = createAction({
  auth: apolloAuth,
  name: 'create_account',
  classification: 'WRITE',
  displayName: 'Create Account',
  description: 'Save a company as an account in your Apollo workspace. Apollo does not check for duplicates.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates an account (saved company) in the Apollo CRM with name or domain, owner and stage picked from dropdowns. Apollo never deduplicates accounts, so every run creates a new one. Uses no credits.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Company Name', description: 'Name or domain is required.', required: false }),
    domain: Property.ShortText({ displayName: 'Domain', description: 'Company domain without "www.", e.g. example.com.', required: false }),
    owner_id: apolloProps.owner({ displayName: 'Owner', description: 'Apollo user who owns the account.', required: false }),
    account_stage_id: apolloProps.accountStage({ required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    raw_address: Property.ShortText({ displayName: 'Address', description: 'Company location, e.g. "Austin, Texas".', required: false }),
    typed_custom_fields: apolloProps.customFields({ modality: 'account' }),
  },
  outputSchema: apolloOutputSchemas.humanAccount,
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
      throw new Error('Enter a company name or a domain.');
    }
    const response = await apolloRequests.createAccount({ apiKey: apiKeyOf(auth), body });
    return { account: apolloMappers.account(response['account']) };
  },
});
