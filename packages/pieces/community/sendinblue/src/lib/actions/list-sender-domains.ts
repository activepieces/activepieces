import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listSenderDomainsActionOutputSchema } from '../output-schemas';

export const listSenderDomains = createAction({
	auth: sendinblueAuth,
	name: 'list_sender_domains',
	outputSchema: listSenderDomainsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Sender Domains',
	description: 'List the sender domains configured in the Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every sender domain configured in the Brevo account along with its authentication and verification status. Use this to check whether a domain is verified before sending from it, rather than guessing its DNS setup state. Read-only and idempotent.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const response = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/senders/domains',
		});

		return response;
	},
});
