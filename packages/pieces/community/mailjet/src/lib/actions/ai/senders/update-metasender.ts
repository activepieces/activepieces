import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetMetasenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateMetasenderAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_metasender',
	outputSchema: mailjetMetasenderOutputSchema,
	displayName: 'Update Metasender',
	description: 'Updates the description of a metasender.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the description of a metasender (from List Metasenders). The address itself cannot be changed.',
		idempotent: true,
	},
	props: {
		metasenderId: mailjetAiProps.id({
			displayName: 'Metasender ID',
			description: 'Numeric metasender ID, from List Metasenders or Create Metasender.',
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'New description.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/metasender/${encodeURIComponent(p.metasenderId)}`,
			body: { Description: p.description },
		});
	},
});
