import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { updateFormOutputSchema } from '../output-schemas';

export const updateForm = createAction({
	auth: tallyAuth,
	name: 'update_form',
	displayName: 'Update Form',
	description: "Partially updates a form's name, status, or blocks.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Partially updates a Tally form by id. Only the fields you provide are changed; omitted fields keep their current value. Use to rename a form, flip its published status, or replace its blocks (question list). Blocks — the ordered array of form questions — replace the entire question set, so pass the full desired array; call Get Form first to fetch the current blocks if you want to append or edit rather than replace. Safe to re-apply the same field values.",
		idempotent: true,
	},
	outputSchema: updateFormOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form to update. Obtain from List Forms.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New display name for the form. Leave empty to keep unchanged.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'New status for the form. Leave unset to keep unchanged.',
			required: false,
			options: {
				options: [
					{ label: 'Keep unchanged', value: '' },
					{ label: 'Draft', value: 'DRAFT' },
					{ label: 'Published', value: 'PUBLISHED' },
				],
			},
		}),
		blocks: Property.Json({
			displayName: 'Blocks',
			description:
				'Optional replacement array of blocks (form questions). Fetch current blocks via Get Form and edit — sending this REPLACES all existing blocks.',
			required: false,
		}),
	},
	async run(context) {
		const body: Record<string, unknown> = {};
		if (context.propsValue.name !== undefined && context.propsValue.name !== '') {
			body['name'] = context.propsValue.name;
		}
		if (context.propsValue.status !== undefined && context.propsValue.status !== '') {
			body['status'] = context.propsValue.status;
		}
		if (context.propsValue.blocks !== undefined && context.propsValue.blocks !== null) {
			body['blocks'] = context.propsValue.blocks;
		}
		return tallyApiClient.request<Record<string, unknown>>({
			method: HttpMethod.PATCH,
			path: `/forms/${context.propsValue.form_id}`,
			apiKey: context.auth.secret_text,
			body,
		});
	},
});
