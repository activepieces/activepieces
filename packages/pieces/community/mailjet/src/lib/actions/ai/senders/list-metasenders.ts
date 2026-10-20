import { createAction } from '@activepieces/pieces-framework';

import { mailjetMetasenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListMetasendersAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_metasenders',
	outputSchema: mailjetMetasenderOutputSchema,
	displayName: 'List Metasenders',
	description: 'Lists metasenders shared across API keys.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists metasenders (sender addresses or domains usable by every API key of the account). Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/metasender',
			query: { ...mailjetUtils.pagingQuery(p) },
		});
	},
});
