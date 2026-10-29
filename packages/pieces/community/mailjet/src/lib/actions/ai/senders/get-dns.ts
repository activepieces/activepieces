import { createAction } from '@activepieces/pieces-framework';

import { mailjetDnsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetDnsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_dns',
	outputSchema: mailjetDnsOutputSchema,
	displayName: 'Get Domain',
	description: 'Gets the SPF and DKIM state of one sending domain.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets a sending domain by its DNS ID or domain name, with its SPF and DKIM records and status.',
		idempotent: true,
	},
	props: {
		dnsId: mailjetAiProps.id({
			displayName: 'DNS ID or Domain',
			description: 'Numeric DNS ID (from List Domains or Get Sender) or the domain name.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/dns/${encodeURIComponent(p.dnsId)}`,
		});
	},
});
