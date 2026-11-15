import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';
import { updateFormActionOutputSchema } from '../output-schemas';

export const updateFormAction = createAction({
	auth: tallyAuth,
	name: 'update_form',
	classification: 'WRITE',
	displayName: 'Update Form',
	description: 'Update a form\'s name, status, blocks, or settings',
	audience: 'ai',
	outputSchema: updateFormActionOutputSchema,
	aiMetadata: {
		description:
			'Partially updates a form: only the fields you provide are changed, everything else is left as-is. Passing blocks or settings replaces that whole field, so fetch the current form with Get Form first if you need to preserve unrelated blocks/settings. Repeating the same call converges on the same state, so it is idempotent.',
		idempotent: true,
	},
	props: {
		form_id: formsDropdown,
		name: Property.ShortText({
			displayName: 'Name',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Blank', value: 'BLANK' },
					{ label: 'Draft', value: 'DRAFT' },
					{ label: 'Published', value: 'PUBLISHED' },
				],
			},
		}),
		blocks: Property.Json({
			displayName: 'Blocks',
			description:
				'Replaces the entire blocks array. Use Get Form first to fetch the current blocks so you can merge your change into the full array rather than dropping the rest of the form content.',
			required: false,
		}),
		settings: Property.Json({
			displayName: 'Settings',
			description: 'Replaces the entire settings object. Use Get Form first if you need to preserve other settings.',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.updateForm({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			name: propsValue.name,
			status: propsValue.status,
			blocks: propsValue.blocks,
			settings: propsValue.settings,
		});
	},
});
