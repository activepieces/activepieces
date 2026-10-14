import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteLabelAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_label',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Label',
	description: 'Deletes a label.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Deletes a label and removes it from every template or image. Cannot be undone.',
		idempotent: false,
	},
	props: {
		labelId: mailjetAiProps.id({
			displayName: 'Label ID',
			description: 'Numeric label ID, from List Labels or Create Label.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v1/REST/labels/${encodeURIComponent(p.labelId)}`,
		});
	},
});
