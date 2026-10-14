import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listTimezonesOutputSchema } from '../output-schemas';

export const listTimezonesAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_timezones',
	classification: 'READ',
	displayName: 'List Timezones',
	description: 'List the timezones MailerLite supports.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the timezones MailerLite supports, with their IDs, names and UTC offsets. Read-only.',
		idempotent: true,
	},
	outputSchema: listTimezonesOutputSchema,
	props: {},
	async run(context) {
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/timezones',
		});
		return body;
	},
});
