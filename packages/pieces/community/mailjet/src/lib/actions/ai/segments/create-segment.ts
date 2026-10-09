import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSegmentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateSegmentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_segment',
	outputSchema: mailjetSegmentOutputSchema,
	displayName: 'Create Segment',
	description: 'Creates a contact segment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a segment that selects contacts by a rule over contact properties, for use as the segment of a campaign draft.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', description: 'Segment name.', required: true }),
		expression: Property.ShortText({
			displayName: 'Expression',
			description:
				'Segment rule in Mailjet segmentation syntax, e.g. "(age>35) AND (country=\'France\')"; property names must exist.',
			required: true,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Optional description.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/contactfilter',
			body: { Name: p.name, Expression: p.expression, Description: p.description },
		});
	},
});
