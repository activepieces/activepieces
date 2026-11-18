import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListLabelsOutputSchema } from '../../../output-schemas';

export const zohoDeskListLabelsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_labels',
	outputSchema: zohoDeskListLabelsOutputSchema,
	displayName: 'List Labels',
	description: 'Lists the help-center user labels.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the labels that can be put on help-center users, with their IDs and names, optionally filtered by name. Use it to get the label IDs for Assign User Labels and Remove User Labels.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		helpCenterId: Property.ShortText({
			displayName: 'Help Center ID',
			description: 'Help center ID (from List Help Centers); needed when there is more than one.',
			required: false,
		}),
		searchBy: Property.ShortText({
			displayName: 'Search By',
			description: 'Only labels with this exact name; end it with * to match a prefix (e.g. `vip*`).',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, helpCenterId, searchBy, from, limit } = context.propsValue;
		const labels = await zohoDeskApi.listLabels({
			auth: context.auth,
			orgId,
			helpCenterId,
			searchBy,
			from,
			limit,
		});
		return { labels, count: labels.length };
	},
});
