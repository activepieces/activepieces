import { createAction } from '@activepieces/pieces-framework';

import { mailjetSenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetSenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_sender',
	outputSchema: mailjetSenderOutputSchema,
	displayName: 'Get Sender',
	description: 'Gets one sender.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a sender by its numeric ID, including its status and DNS ID.',
		idempotent: true,
	},
	props: {
		senderId: mailjetAiProps.id({
			displayName: 'Sender ID',
			description: 'Numeric sender ID, from List Senders or Create Sender.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/sender/${encodeURIComponent(p.senderId)}`,
		});
	},
});
