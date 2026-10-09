import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSegmentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateSegmentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_segment',
	outputSchema: mailjetSegmentOutputSchema,
	displayName: 'Update Segment',
	description: 'Updates a contact segment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the name, expression and/or description of a segment. Only the fields you set change.',
		idempotent: true,
	},
	props: {
		segmentId: mailjetAiProps.id({
			displayName: 'Segment ID',
			description: 'Numeric segment ID, from List Segments or Create Segment.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New segment name.',
			required: false,
		}),
		expression: Property.ShortText({
			displayName: 'Expression',
			description:
				'Segment rule in Mailjet segmentation syntax, e.g. "(age>35) AND (country=\'France\')"; property names must exist.',
			required: false,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'New description.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/contactfilter/${encodeURIComponent(p.segmentId)}`,
			body: { Name: p.name, Expression: p.expression, Description: p.description },
		});
	},
});
