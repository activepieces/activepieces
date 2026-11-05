import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMessagingProfileShortCodesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_messaging_profile_short_codes',
	displayName: 'List Messaging Profile Short Codes',
	description: 'Lists the short codes assigned to a messaging profile.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists one page of short codes assigned to a messaging profile.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMessagingProfileShortCodes({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			query: telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
		});
	},
});
