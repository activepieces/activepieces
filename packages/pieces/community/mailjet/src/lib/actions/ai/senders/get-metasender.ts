import { createAction } from '@activepieces/pieces-framework';

import { mailjetMetasenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetMetasenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_metasender',
	outputSchema: mailjetMetasenderOutputSchema,
	displayName: 'Get Metasender',
	description: 'Gets one metasender.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a metasender by its numeric ID.',
		idempotent: true,
	},
	props: {
		metasenderId: mailjetAiProps.id({
			displayName: 'Metasender ID',
			description: 'Numeric metasender ID, from List Metasenders or Create Metasender.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/metasender/${encodeURIComponent(p.metasenderId)}`,
		});
	},
});
