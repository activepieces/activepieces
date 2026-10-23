import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNotificationChannelsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_notification_channels',
	displayName: 'List Notification Channels',
	description: 'Lists the channels account notifications are delivered to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of notification channels (an SMS number, voice number, email address or webhook URL tied to a notification profile). Filter by channel type.',
		idempotent: true,
	},
	props: {
		channelTypeId: Property.StaticDropdown({
			displayName: 'Channel Type',
			description: 'Only channels of this type.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'SMS', value: 'sms' },
					{ label: 'Voice', value: 'voice' },
					{ label: 'Email', value: 'email' },
					{ label: 'Webhook', value: 'webhook' },
				],
			},
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNotificationChannels({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({ values: { 'filter[channel_type_id][eq]': p.channelTypeId } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
