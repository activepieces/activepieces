import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNotificationProfilesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_notification_profiles',
	displayName: 'List Notification Profiles',
	description: 'Lists notification profiles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of notification profiles, the named groups that notification channels and settings belong to.',
		idempotent: true,
	},
	props: {
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNotificationProfiles({
			auth: context.auth,
			query: {
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
