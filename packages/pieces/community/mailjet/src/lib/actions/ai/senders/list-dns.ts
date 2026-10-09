import { createAction } from '@activepieces/pieces-framework';

import { mailjetDnsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListDnsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_dns',
	outputSchema: mailjetDnsOutputSchema,
	displayName: 'List Domains',
	description: 'Lists sending domains with their SPF and DKIM state.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the sending domains of the account with their DNS ID, SPF and DKIM status and the records to publish. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/dns',
			query: { ...mailjetUtils.pagingQuery(p) },
		});
	},
});
