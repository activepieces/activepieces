import { createAction } from '@activepieces/pieces-framework';

import { mailjetTemplateLockOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetLockTemplateContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_lock_template_content',
	outputSchema: mailjetTemplateLockOutputSchema,
	displayName: 'Lock Template Content',
	description: 'Locks the content of a template against edits.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Locks the template content so it cannot be edited until unlocked.',
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
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}/contents/lock`,
			body: {},
		});
		return { locked: true };
	},
});
