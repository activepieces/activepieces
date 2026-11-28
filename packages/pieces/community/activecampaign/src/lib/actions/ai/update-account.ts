import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { accountAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const updateAccountAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_account_ai',
	classification: 'WRITE',
	displayName: 'Update Account (AI)',
	description: 'Updates an account (company).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Changes the name, URL or custom field values of an existing account; fields you leave empty are not sent. Find the account ID with List Accounts. Safe to repeat with the same input.',
		idempotent: true,
	},
	outputSchema: accountAiOutputSchema,
	props: {
		account_id: Property.ShortText({ displayName: 'Account ID', description: 'Use List Accounts to find the ID.', required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		account_url: Property.ShortText({ displayName: 'Account URL', required: false }),
		custom_fields: aiProps.accountCustomFields,
	},
	async run({ auth, propsValue }) {
		const accountId = aiInput.numericId({ value: propsValue.account_id, label: 'Account ID' });
		const fields = aiInput.accountFields(aiInput.customFieldEntries({ value: propsValue.custom_fields, label: 'Custom Fields' }));
		const name = aiInput.optionalText(propsValue.name);
		const accountUrl = aiInput.optionalText(propsValue.account_url);
		if (name === undefined && accountUrl === undefined && fields.length === 0) {
			throw new Error('Nothing to update: give a Name, Account URL or Custom Fields.');
		}
		const account = {
			...(name !== undefined ? { name } : {}),
			...(accountUrl !== undefined ? { accountUrl } : {}),
			...(fields.length > 0 ? { fields } : {}),
		};
		const body = await makeClient(auth.props).updateAccount({ accountId, account });
		const updated = acData.recordAt({ value: body, key: 'account' });
		return { ...aiOutput.accountSummary(updated), ...aiOutput.accountCustomFieldValues(updated) };
	},
});
