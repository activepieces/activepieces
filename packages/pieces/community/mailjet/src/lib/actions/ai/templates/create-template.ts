import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetTemplateOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateTemplateAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_template',
	outputSchema: mailjetTemplateOutputSchema,
	displayName: 'Create Template',
	description: 'Creates an email template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an empty email template. Add its content with Create Template Content, then Publish Template Content before using it in Send Email.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Template name, unique in the account.',
			required: true,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Short description.',
			required: false,
		}),
		purposes: Property.StaticMultiSelectDropdown({
			displayName: 'Purposes',
			description: 'What the template is for; needed for it to appear in the Mailjet app.',
			required: false,
			options: {
				options: ['marketing', 'transactional', 'automation', 'opt-in'].map((value) => ({
					label: value,
					value,
				})),
			},
		}),
		editMode: Property.StaticDropdown({
			displayName: 'Edit Mode',
			description: 'Editor of the template: HTML builder (default) or MJML builder.',
			required: false,
			options: {
				options: [
					{ label: 'HTML builder', value: 2 },
					{ label: 'MJML builder', value: 4 },
				],
			},
		}),
		labelIds: Property.Array({
			displayName: 'Label IDs',
			description: 'Numeric label IDs, from List Labels.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v1/REST/templates',
			body: {
				Name: p.name,
				Description: p.description,
				Purposes: p.purposes,
				EditMode: p.editMode,
				LabelIDs: p.labelIds,
			},
		});
	},
});
