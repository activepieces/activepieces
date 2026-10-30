import { createAction } from '@activepieces/pieces-framework';

import { mauticDeletePushNotificationOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeletePushNotificationAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_push_notification',
	outputSchema: mauticDeletePushNotificationOutputSchema,
	displayName: 'Delete Push Notification',
	description: 'Permanently deletes a Mautic push notification.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a web push notification. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Push Notification Id',
			description:
				'Numeric push notification id, from List Push Notifications or Create Push Notification.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'notifications',
			id: context.propsValue.id,
		});
	},
});
