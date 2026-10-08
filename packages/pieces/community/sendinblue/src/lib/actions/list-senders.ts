import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listSendersActionOutputSchema } from '../output-schemas';

export const listSenders = createAction({
	auth: sendinblueAuth,
	name: 'list_senders',
	outputSchema: listSendersActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Senders',
	description: 'List the verified senders in the Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every verified sender configured in the Brevo account, optionally filtered by dedicated IP or sender domain. This is the standalone way to see all senders; the Send Transactional Email action uses this same endpoint internally to populate its sender dropdown. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		ip: Property.ShortText({
			displayName: 'IP',
			description:
				'Filter by a specific dedicated IP; dedicated-IP accounts only.',
			required: false,
		}),
		domain: Property.ShortText({
			displayName: 'Domain',
			description: 'Filter by sender domain.',
			required: false,
		}),
	},
	async run(context) {
		const { ip, domain } = context.propsValue;

		const response = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/senders',
			query: {
				ip,
				domain,
			},
		});

		return response;
	},
});
