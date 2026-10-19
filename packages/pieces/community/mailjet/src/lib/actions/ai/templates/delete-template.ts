import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteTemplateAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_template',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Template',
	description: 'Deletes an email template.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a template and all its content versions. Cannot be undone.',
		idempotent: false,
	},
	props: {
		templateId: mailjetAiProps.id({
			displayName: 'Template ID',
			description: 'Numeric template ID, from List Templates or Create Template.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}`,
		});
	},
});
