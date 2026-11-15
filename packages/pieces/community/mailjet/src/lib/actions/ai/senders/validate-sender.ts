import { createAction } from '@activepieces/pieces-framework';

import { mailjetSenderValidationOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetValidateSenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_validate_sender',
	outputSchema: mailjetSenderValidationOutputSchema,
	displayName: 'Validate Sender',
	description: 'Checks whether a sender can be validated.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Asks Mailjet to validate a sender through its domain DNS records or validation email, and returns the result and any errors.',
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
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/sender/${encodeURIComponent(p.senderId)}/validate`,
			body: {},
		});
	},
});
