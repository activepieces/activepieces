import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteSenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_sender',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Sender',
	description: 'Deletes a sender.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Deletes a sender; it can no longer send. Cannot be undone.',
		idempotent: false,
	},
	props: {
		senderId: mailjetAiProps.id({
			displayName: 'Sender ID',
			description: 'Numeric sender ID, from List Senders or Create Sender.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v3/REST/sender/${encodeURIComponent(p.senderId)}`,
		});
	},
});
