import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetTemplateContentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetTemplateContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_template_content',
	outputSchema: mailjetTemplateContentOutputSchema,
	displayName: 'Get Template Content',
	description: 'Gets the draft or published content of a template.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets the latest draft or published content of a template.',
		idempotent: true,
	},
	props: {
		templateId: mailjetAiProps.id({
			displayName: 'Template ID',
			description: 'Numeric template ID, from List Templates or Create Template.',
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Version',
			description: 'D for the draft content, P for the published content.',
			required: true,
			options: {
				options: [
					{ label: 'D', value: 'D' },
					{ label: 'P', value: 'P' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(
				p.templateId,
			)}/contents/types/${encodeURIComponent(p.contentType)}`,
		});
	},
});
