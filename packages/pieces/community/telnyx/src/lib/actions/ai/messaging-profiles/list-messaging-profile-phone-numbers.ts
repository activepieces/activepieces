import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMessagingProfilePhoneNumbersAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_messaging_profile_phone_numbers',
	displayName: 'List Messaging Profile Phone Numbers',
	description: 'Lists the phone numbers assigned to a messaging profile.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of phone numbers assigned to a messaging profile, with their messaging product, health and features.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMessagingProfilePhoneNumbers({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			query: telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
		});
	},
});
