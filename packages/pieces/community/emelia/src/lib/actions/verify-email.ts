import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaEnrichment } from '../common/enrichment';

export const verifyEmailAction = createAction({
	auth: emeliaAuth,
	name: 'verify_email',
	classification: 'READ',
	displayName: 'Verify Email',
	description: 'Checks whether an email address can receive emails. Costs 0.25 Emelia credit.',
	audience: 'both',
	aiMetadata: {
		description:
			"Check the deliverability of one email address with Emelia's Email Verifier and return its verdict (for example valid or invalid), waiting up to 90 seconds. Use Find Email instead when you do not have an address yet. Each call costs 0.25 credit, never refunded.",
		idempotent: true,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
			placeholder: 'jane.doe@acme.com',
		}),
	},
	async run(context) {
		const email = context.propsValue.email.trim();
		const { jobId, job, timedOut } = await emeliaEnrichment.runJob({
			apiKey: context.auth.secret_text,
			path: '/tools/verify/email',
			body: { email },
			maxWaitMs: MAX_WAIT_MS,
		});
		return {
			job_id: jobId,
			email,
			status: job.status ?? null,
			result: emeliaClient.readString({ source: job, key: 'qualification' }),
			timed_out: timedOut,
		};
	},
});

const MAX_WAIT_MS = 90_000;
