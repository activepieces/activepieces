import { createAction } from '@activepieces/pieces-framework';

import { mauticGetPushNotificationOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetPushNotificationAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_push_notification',
	outputSchema: mauticGetPushNotificationOutputSchema,
	displayName: 'Get Push Notification',
	description: 'Gets one Mautic push notification by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single web push notification by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Push Notification Id',
			description:
				'Numeric push notification id, from List Push Notifications or Create Push Notification.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'notifications',
			id: context.propsValue.id,
		});
	},
});
