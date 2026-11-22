import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { accountAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const createAccountAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_account_ai',
	classification: 'WRITE',
	displayName: 'Create Account (AI)',
	description: 'Creates an account (company).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates an account (CRM company) with a name, optional URL and custom field values. Check List Accounts first to avoid duplicates; to change an existing account use Update Account (AI). Each call creates an account, so do not repeat it.',
		idempotent: false,
	},
	outputSchema: accountAiOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		account_url: Property.ShortText({ displayName: 'Account URL', description: 'The company website.', required: false }),
		custom_fields: aiProps.accountCustomFields,
	},
	async run({ auth, propsValue }) {
		const fields = aiInput.accountFields(aiInput.customFieldEntries({ value: propsValue.custom_fields, label: 'Custom Fields' }));
		const account = {
			name: aiInput.requireText({ value: propsValue.name, label: 'Name' }),
			accountUrl: aiInput.optionalText(propsValue.account_url),
			...(fields.length > 0 ? { fields } : {}),
		};
		const body = await makeClient(auth.props).createAccount(account);
		const created = acData.recordAt({ value: body, key: 'account' });
		return { ...aiOutput.accountSummary(created), ...aiOutput.accountCustomFieldValues(created) };
	},
});
