import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiOutput } from '../../common/ai-props';
import { listContactCustomFieldsOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const listContactCustomFieldsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_contact_custom_fields',
	classification: 'SEARCH',
	displayName: 'List Contact Custom Fields',
	description: 'Lists the contact custom fields and their options.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every contact custom field with its ID, type and allowed option values. Use it to build the Custom Fields object of Create or Update Contact (AI). Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listContactCustomFieldsOutputSchema,
	props: {},
	async run({ auth }) {
		const all = await makeClient(auth.props).listAll({ path: '/fields', key: 'fields', sideKeys: ['fieldOptions'] });
		const options = all.side['fieldOptions'] ?? [];
		const items = all.items.map((field) => {
			const id = acData.textAt({ value: field, key: 'id' });
			return {
				...aiOutput.idText({ record: field, keys: ['id', 'title', 'type', 'perstag'] }),
				options: options
					.filter((option) => acData.textAt({ value: option, key: 'field' }) === id)
					.map((record) => aiOutput.idText({ record, keys: ['value', 'label'] })),
			};
		});
		return { items, total: items.length };
	},
});
