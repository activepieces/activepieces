import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMessagingProfileMetricsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_messaging_profile_metrics',
	displayName: 'List Messaging Profile Metrics',
	description: 'Lists sent/delivered/failed message counts for every messaging profile.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists high-level outbound and inbound message metrics (counts, delivery and error rates) for every messaging profile over a time frame. For one profile in detail use Get Messaging Profile Metrics.',
		idempotent: true,
	},
	props: {
		timeFrame: Property.StaticDropdown({
			displayName: 'Time Frame',
			description: 'Period the metrics cover. Defaults to 24h.',
			required: false,
			options: {
				disabled: false,
				options: ['1h', '3h', '24h', '3d', '7d', '30d'].map((value) => ({
					label: value,
					value,
				})),
			},
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMessagingProfileMetrics({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({ values: { time_frame: p.timeFrame } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
