import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiOutput } from '../../common/ai-props';
import { listAccountCustomFieldsOutputSchema } from '../../common/output-schemas';

export const listAccountCustomFieldsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_account_custom_fields',
	classification: 'SEARCH',
	displayName: 'List Account Custom Fields',
	description: 'Lists the account custom fields and their options.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every account custom field with its ID, type and allowed option values. Use it to build the Custom Fields object of Create Account (AI) and Update Account (AI). Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listAccountCustomFieldsOutputSchema,
	props: {},
	async run({ auth }) {
		const all = await makeClient(auth.props).listAccountCustomFields();
		const items = all.items.map((record) => aiOutput.idText({ record, keys: ['id', 'fieldLabel', 'fieldType', 'fieldOptions'] }));
		return { items, total: items.length };
	},
});
