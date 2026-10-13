import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFieldOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteFieldAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_field',
	outputSchema: mauticDeleteFieldOutputSchema,
	displayName: 'Delete Field',
	description: 'Permanently deletes a Mautic field.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a custom field and the value it holds on every contact or company. Needs an administrator account. Cannot be undone.',
		idempotent: false,
	},
	props: {
		object: Property.StaticDropdown({
			displayName: 'Object',
			required: true,
			options: {
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Company', value: 'company' },
				],
			},
		}),
		id: mauticAiProps.recordId({
			displayName: 'Field Id',
			description: 'Numeric field id, from List Fields or Create Field.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: `fields/${context.propsValue.object}`,
			id: context.propsValue.id,
		});
	},
});
