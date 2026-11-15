import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateSenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_sender',
	outputSchema: mailjetSenderOutputSchema,
	displayName: 'Create Sender',
	description: 'Registers a sender address or domain.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Registers a sender address (or a whole domain as *@domain.com). Mailjet emails the address to confirm it; the sender stays Inactive until validated (see Validate Sender).',
		idempotent: false,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Sender address, or *@domain.com for a domain.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Sender display name.',
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
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/sender',
			body: {
				Email: p.email,
				Name: p.name,
				EmailType: p.emailType,
				IsDefaultSender: p.isDefaultSender,
			},
		});
	},
});
