import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMessagingOptoutsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_messaging_optouts',
	displayName: 'List Messaging Opt-Outs',
	description: 'Lists recipients who opted out of messages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of numbers that opted out (e.g. replied STOP), with the sender they opted out from, the keyword and time. Filter by messaging profile or recipient. Check this before messaging a number to avoid sending to opted-out recipients.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: false }),
		from: Property.ShortText({
			displayName: 'Opted-Out Number',
			description: 'Only return opt-outs from this phone number (E.164).',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMessagingOptouts({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({
					filters: { messaging_profile_id: p.messagingProfileId, from: p.from },
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
