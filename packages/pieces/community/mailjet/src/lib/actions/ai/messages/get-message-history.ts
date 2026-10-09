import { createAction } from '@activepieces/pieces-framework';

import { mailjetMessageHistoryOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetMessageHistoryAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_message_history',
	outputSchema: mailjetMessageHistoryOutputSchema,
	displayName: 'Get Message History',
	description: 'Gets the event history of one sent message.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists the events of a sent message (sent, opened, clicked, bounced, ...) with their times.',
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
			path: `/v3/REST/messagehistory/${encodeURIComponent(p.messageId)}`,
		});
	},
});
