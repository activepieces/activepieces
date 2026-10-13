import { createAction } from '@activepieces/pieces-framework';

import { mailjetMessageOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetMessageAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_message',
	outputSchema: mailjetMessageOutputSchema,
	displayName: 'Get Message',
	description: 'Gets one sent message.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a sent message by ID with its status, arrival time and campaign.',
		idempotent: true,
	},
	props: {
		messageId: mailjetAiProps.id({
			displayName: 'Message ID',
			description: 'Numeric message ID, from Send Email (MessageID) or List Messages.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/message/${encodeURIComponent(p.messageId)}`,
		});
	},
});
