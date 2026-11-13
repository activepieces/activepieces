import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetLabelOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListLabelsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_labels',
	outputSchema: mailjetLabelOutputSchema,
	displayName: 'List Labels',
	description: 'Lists the labels used to tag templates and images.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists labels with their IDs, names and colors. Label IDs are used by template and image actions. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only the label with this name.',
			required: false,
		}),
		usedFor: Property.StaticDropdown({
			displayName: 'Used For',
			description: 'resource for template labels, image for image labels.',
			required: false,
			options: {
				options: [
					{ label: 'resource', value: 'resource' },
					{ label: 'image', value: 'image' },
				],
			},
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v1/REST/labels',
			query: { Name: p.name, UsedFor: p.usedFor, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
