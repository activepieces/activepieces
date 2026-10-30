import { createAction } from '@activepieces/pieces-framework';

import { mailjetTemplateOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetTemplateAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_template',
	outputSchema: mailjetTemplateOutputSchema,
	displayName: 'Get Template',
	description: 'Gets one email template.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a template by its numeric ID, including its ExternalID and publish state.',
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
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}`,
		});
	},
});
