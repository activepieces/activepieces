import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { countSubscribersOutputSchema } from '../output-schemas';

export const countSubscribersAction = createAction({
	auth: mailerLiteAuth,
	name: 'count_subscribers',
	classification: 'READ',
	displayName: 'Count Subscribers',
	description: 'Get the total number of subscribers in the account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Get the total number of subscribers in the MailerLite account without listing them. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: countSubscribersOutputSchema,
	props: {},
	async run(context) {
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/subscribers',
			queryParams: { limit: 0 },
		});
		if (!mailerLiteApi.isRecord(body)) {
			throw new Error('MailerLite returned an unexpected response for the subscriber count.');
		}
		const meta = body['meta'];
		const rawTotal = body['total'] ?? (mailerLiteApi.isRecord(meta) ? meta['total'] : undefined);
		const total = Number(rawTotal);
		if (rawTotal === undefined || rawTotal === null || !Number.isFinite(total)) {
			throw new Error('MailerLite did not return a subscriber total.');
		}
		return { total };
	},
});
