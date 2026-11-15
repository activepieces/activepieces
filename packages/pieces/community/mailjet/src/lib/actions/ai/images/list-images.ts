import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetImageOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListImagesAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_images',
	outputSchema: mailjetImageOutputSchema,
	displayName: 'List Images',
	description: 'Lists images in the image gallery.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists gallery images with their IDs, names, URLs and status. Filter by name or starred flag. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		partialName: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only images whose name contains this text.',
			required: false,
		}),
		isStarred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes for starred images only.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v1/REST/images',
			query: { PartialName: p.partialName, IsStarred: p.isStarred, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
