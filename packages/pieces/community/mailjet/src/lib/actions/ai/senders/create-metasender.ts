import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetMetasenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateMetasenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_metasender',
	outputSchema: mailjetMetasenderOutputSchema,
	displayName: 'Create Metasender',
	description: 'Registers a metasender shared across API keys.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Registers a sender address or domain (*@domain.com) usable by every API key of the account. Mailjet support must validate it before it can send.',
		idempotent: false,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Address, or *@domain.com for a domain.',
			required: true,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Readable description.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/metasender',
			body: { Email: p.email, Description: p.description },
		});
	},
});
