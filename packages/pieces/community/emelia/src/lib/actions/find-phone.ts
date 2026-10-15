import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaEnrichment } from '../common/enrichment';

export const findPhoneAction = createAction({
	auth: emeliaAuth,
	name: 'find_phone',
	classification: 'SEARCH',
	displayName: 'Find Phone Number',
	description: "Finds a person's mobile phone number from their LinkedIn profile. Costs 50 Emelia credits, refunded when nothing is found.",
	audience: 'both',
	aiMetadata: {
		description:
			"Find the mobile phone number of one person from their LinkedIn profile URL with Emelia's Phone Finder, waiting up to 4 minutes; if the provider is slower, timed_out is true and no number is returned. Each call starts a new search costing 50 credits (refunded when nothing is found), so avoid needless retries.",
		idempotent: true,
	},
	props: {
		linkedinUrl: Property.ShortText({
			displayName: 'LinkedIn Profile URL',
			description: 'The URL of the person\'s LinkedIn profile, for example `https://www.linkedin.com/in/janedoe`.',
			required: true,
			placeholder: 'https://www.linkedin.com/in/janedoe',
		}),
	},
	async run(context) {
		const linkedinUrl = context.propsValue.linkedinUrl.trim();
		if (!linkedinUrl.includes('linkedin.com/in/')) {
			throw new Error('The LinkedIn Profile URL must look like https://www.linkedin.com/in/<profile>.');
		}
		const { jobId, job, timedOut } = await emeliaEnrichment.runJob({
			apiKey: context.auth.secret_text,
			path: '/tools/find/phone',
			body: { linkedinUrl },
			maxWaitMs: MAX_WAIT_MS,
		});
		const phoneNumber = emeliaClient.readString({ source: job, key: 'phoneNumber' });
		return {
			job_id: jobId,
			status: job.status ?? null,
			found: phoneNumber !== null,
			phone_number: phoneNumber,
			country: emeliaClient.readString({ source: job, key: 'country' }),
			timed_out: timedOut,
		};
	},
});

const MAX_WAIT_MS = 240_000;
