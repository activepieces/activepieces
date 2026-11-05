import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMessagingProfileAlphanumericSenderIdsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_messaging_profile_alphanumeric_sender_ids',
	displayName: 'List Messaging Profile Alphanumeric Sender IDs',
	description: 'Lists the alphanumeric sender IDs of a messaging profile.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of alphanumeric sender IDs registered on a messaging profile. Pass one in the From field of Send Message together with the profile id.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMessagingProfileAlphanumericSenderIds({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			query: telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
		});
	},
});
