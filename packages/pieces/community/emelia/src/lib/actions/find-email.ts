import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaEnrichment } from '../common/enrichment';

export const findEmailAction = createAction({
	auth: emeliaAuth,
	name: 'find_email',
	classification: 'SEARCH',
	displayName: 'Find Email',
	description: "Finds a person's professional email address from their name and company. Costs 1 Emelia credit, refunded when nothing is found.",
	audience: 'both',
	aiMetadata: {
		description:
			"Find the professional email address of one person from their full name, company name and country (company website strongly improves results) with Emelia's Email Finder, waiting up to about 4.5 minutes for the result. Use Verify Email instead when you already have an address. Each call starts a new search costing 1 credit (refunded when nothing is found), so avoid needless retries.",
		idempotent: true,
	},
	props: {
		fullName: Property.ShortText({
			displayName: 'Full Name',
			description: 'First and last name of the person.',
			required: true,
			placeholder: 'Jane Doe',
		}),
		companyName: Property.ShortText({
			displayName: 'Company Name',
			required: true,
			placeholder: 'Acme',
		}),
		companyWebsite: Property.ShortText({
			displayName: 'Company Website',
			description: 'The company domain or website. Strongly improves results.',
			required: false,
			placeholder: 'acme.com',
		}),
		country: Property.ShortText({
			displayName: 'Country Code',
			description: 'Two-letter country code of the person, for example `FR` for France, `US` for the United States or `GB` for the United Kingdom.',
			required: true,
			placeholder: 'FR',
		}),
	},
	async run(context) {
		const { fullName, companyName, companyWebsite, country } = context.propsValue;
		const countryCode = country.trim().toUpperCase();
		if (!/^[A-Z]{2}$/.test(countryCode)) {
			throw new Error(`"${country}" is not a two-letter country code. Use for example FR, US or GB.`);
		}
		const { jobId, job, timedOut } = await emeliaEnrichment.runJob({
			apiKey: context.auth.secret_text,
			path: '/tools/find/email',
			body: {
				fullname: fullName.trim(),
				companyName: companyName.trim(),
				country: countryCode,
				...(companyWebsite?.trim() ? { companyWebsite: companyWebsite.trim() } : {}),
			},
			maxWaitMs: MAX_WAIT_MS,
		});
		const email = emeliaClient.readString({ source: job, key: 'email' });
		return {
			job_id: jobId,
			status: job.status ?? null,
			found: email !== null,
			email,
			qualification: emeliaClient.readString({ source: job, key: 'qualification' }),
			found_with_company_name_only: job['fallbackFound'] === true,
			timed_out: timedOut,
		};
	},
});

const MAX_WAIT_MS = 270_000;
