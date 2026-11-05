import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNotificationEventConditionsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_notification_event_conditions',
	displayName: 'List Notification Event Conditions',
	description: 'Lists the conditions a notification setting can subscribe to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of notification event conditions with their parameters and supported channels. The condition id is what Create Notification Setting needs.',
		idempotent: true,
	},
	props: {
		associatedRecordType: Property.ShortText({
			displayName: 'Associated Record Type',
			description: 'Only conditions for this record type, e.g. "account" or "phone_number".',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNotificationEventConditions({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({
					values: { 'filter[associated_record_type][eq]': p.associatedRecordType },
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
