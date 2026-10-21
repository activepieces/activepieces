import { createAction } from '@activepieces/pieces-framework';

import { mailjetTemplateContentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetPublishTemplateContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_publish_template_content',
	outputSchema: mailjetTemplateContentOutputSchema,
	displayName: 'Publish Template Content',
	description: 'Publishes the latest draft content of a template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Publishes the latest draft content of a template so Send Email uses it. Republishing the same draft changes nothing.',
		idempotent: true,
	},
	props: {
		templateId: mailjetAiProps.id({
			displayName: 'Template ID',
			description: 'Numeric template ID, from List Templates or Create Template.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}/contents/publish`,
			body: {},
		});
	},
});
