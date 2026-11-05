import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNetworksAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_networks',
	displayName: 'List Networks',
	description: 'Lists private networks on the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists one page of Telnyx private networks with id and name. Filter by name.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only networks with this exact name.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNetworks({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({ filters: { name: p.name } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
