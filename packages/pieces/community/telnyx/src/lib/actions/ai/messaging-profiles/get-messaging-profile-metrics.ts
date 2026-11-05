import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxGetMessagingProfileMetricsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_messaging_profile_metrics',
	displayName: 'Get Messaging Profile Metrics',
	description: 'Gets detailed message metrics for one messaging profile.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets detailed outbound and inbound message metrics for one messaging profile over a time frame. For all profiles at once use List Messaging Profile Metrics.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		timeFrame: Property.StaticDropdown({
			displayName: 'Time Frame',
			description: 'Period the metrics cover. Defaults to 24h.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: '1h', value: '1h' },
					{ label: '3h', value: '3h' },
					{ label: '24h', value: '24h' },
					{ label: '3d', value: '3d' },
					{ label: '7d', value: '7d' },
					{ label: '30d', value: '30d' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.getMessagingProfileMetrics({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			query: telnyxUtils.toQuery({ values: { time_frame: p.timeFrame } }),
		});
	},
});
