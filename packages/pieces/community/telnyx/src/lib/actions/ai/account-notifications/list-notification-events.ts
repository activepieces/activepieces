import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNotificationEventsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_notification_events',
	displayName: 'List Notification Events',
	description: 'Lists the event types notifications can be sent for.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of notification events (event types such as low balance), with category and whether each is enabled. Event conditions from List Notification Event Conditions refine these.',
		idempotent: true,
	},
	props: {
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNotificationEvents({
			auth: context.auth,
			query: {
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
