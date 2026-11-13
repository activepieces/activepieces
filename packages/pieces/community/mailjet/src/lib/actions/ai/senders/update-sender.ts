import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateSenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_sender',
	outputSchema: mailjetSenderOutputSchema,
	displayName: 'Update Sender',
	description: 'Updates a sender.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the name, email type or default flag of a sender. Only the fields you set change.',
		idempotent: true,
	},
	props: {
		senderId: mailjetAiProps.id({
			displayName: 'Sender ID',
			description: 'Numeric sender ID, from List Senders or Create Sender.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New display name.',
			required: false,
		}),
		emailType: Property.StaticDropdown({
			displayName: 'Email Type',
			description: 'Informative type of mail the sender sends.',
			required: false,
			options: {
				options: [
					{ label: 'transactional', value: 'transactional' },
					{ label: 'bulk', value: 'bulk' },
					{ label: 'unknown', value: 'unknown' },
				],
			},
		}),
		isDefaultSender: mailjetAiProps.yesNo({
			displayName: 'Default Sender',
			description: 'Yes makes it the default sender.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/sender/${encodeURIComponent(p.senderId)}`,
			body: { Name: p.name, EmailType: p.emailType, IsDefaultSender: p.isDefaultSender },
		});
	},
});
