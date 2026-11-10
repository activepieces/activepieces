import { createAction } from '@activepieces/pieces-framework';

import { mailjetDnsCheckOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetCheckDnsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_check_dns',
	outputSchema: mailjetDnsCheckOutputSchema,
	displayName: 'Check Domain DNS',
	description: 'Re-checks the SPF and DKIM records of a sending domain.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Runs a fresh SPF and DKIM check on a sending domain and returns the result.',
		idempotent: true,
	},
	props: {
		dnsId: mailjetAiProps.id({
			displayName: 'DNS ID',
			description: 'Numeric DNS (domain) ID, from List Domains.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/dns/${encodeURIComponent(p.dnsId)}/check`,
			body: {},
		});
	},
});
