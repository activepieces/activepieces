import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMessagingProfilesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_messaging_profiles',
	displayName: 'List Messaging Profiles',
	description: 'Lists messaging profiles on the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of messaging profiles with their id, name, webhook URLs, allowed destinations and number pool settings. Use it to find the Messaging Profile ID other actions take.',
		idempotent: true,
	},
	props: {
		nameContains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return profiles whose name contains this text.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMessagingProfilesPage({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({ values: { 'filter[name][contains]': p.nameContains } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
