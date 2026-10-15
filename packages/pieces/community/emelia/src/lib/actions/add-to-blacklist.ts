import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';

export const addToBlacklistAction = createAction({
	auth: emeliaAuth,
	name: 'add_to_blacklist',
	classification: 'WRITE',
	displayName: 'Add to Blacklist',
	description: 'Adds an email address or a whole domain to your blacklist so it is never contacted by any campaign.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add an email address or a bare domain (for example acme.com) to the account-wide Emelia blacklist, excluding it from every current and future campaign. Use Remove Contact from Campaign instead to stop a single campaign only. Safe to retry.',
		idempotent: true,
	},
	props: {
		value: Property.ShortText({
			displayName: 'Email or Domain',
			description: 'An email address (`jane.doe@acme.com`) or a domain without `@` or `https://` (`acme.com`) to block everyone at that company.',
			required: true,
			placeholder: 'jane.doe@acme.com',
		}),
	},
	async run(context) {
		const value = context.propsValue.value.trim();
		await emeliaClient.request({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/emails/blacklists/contact',
			body: { email: value },
		});
		return { success: true, blacklisted: value };
	},
});
