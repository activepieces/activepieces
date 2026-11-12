import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetTemplateOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateTemplateAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_template',
	outputSchema: mailjetTemplateOutputSchema,
	displayName: 'Update Template',
	description: 'Updates the settings of an email template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the name, description, purposes, labels or starred flag of a template. Only the fields you set change. Content is changed with Update Template Content.',
		idempotent: true,
	},
	props: {
		templateId: mailjetAiProps.id({
			displayName: 'Template ID',
			description: 'Numeric template ID, from List Templates or Create Template.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New template name.',
			required: false,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'New description.',
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
		labelIds: Property.Array({
			displayName: 'Label IDs',
			description: 'Numeric label IDs, from List Labels.',
			required: false,
		}),
		isStarred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes stars the template, No unstars it.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}`,
			body: {
				Name: p.name,
				Description: p.description,
				Purposes: p.purposes,
				LabelIDs: p.labelIds,
				IsStarred: p.isStarred,
			},
		});
	},
});
