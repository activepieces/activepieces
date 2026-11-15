import { createAction } from '@activepieces/pieces-framework';

import { mailjetLabelOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetLabelAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_label',
	outputSchema: mailjetLabelOutputSchema,
	displayName: 'Get Label',
	description: 'Gets one label.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a label by its numeric ID.',
		idempotent: true,
	},
	props: {
		labelId: mailjetAiProps.id({
			displayName: 'Label ID',
			description: 'Numeric label ID, from List Labels or Create Label.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v1/REST/labels/${encodeURIComponent(p.labelId)}`,
		});
	},
});
