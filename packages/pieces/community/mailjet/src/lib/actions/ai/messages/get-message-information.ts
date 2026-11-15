import { createAction } from '@activepieces/pieces-framework';

import { mailjetMessageInformationOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetMessageInformationAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_message_information',
	outputSchema: mailjetMessageInformationOutputSchema,
	displayName: 'Get Message Information',
	description: 'Gets delivery details of one sent message.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets delivery details (size, spam score, queued time, ...) of one sent message.',
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
			path: `/v3/REST/messageinformation/${encodeURIComponent(p.messageId)}`,
		});
	},
});
