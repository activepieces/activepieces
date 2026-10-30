import { createAction } from '@activepieces/pieces-framework';

import { mailjetTemplateLockOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUnlockTemplateContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_unlock_template_content',
	outputSchema: mailjetTemplateLockOutputSchema,
	displayName: 'Unlock Template Content',
	description: 'Unlocks the content of a template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Unlocks template content locked with Lock Template Content.',
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
		await mailjetApi.post({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}/contents/unlock`,
			body: {},
		});
		return { locked: false };
	},
});
