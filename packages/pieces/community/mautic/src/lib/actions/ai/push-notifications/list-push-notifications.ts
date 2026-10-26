import { createAction } from '@activepieces/pieces-framework';

import { mauticListPushNotificationsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListPushNotificationsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_push_notifications',
	outputSchema: mauticListPushNotificationsOutputSchema,
	displayName: 'List Push Notifications',
	description: 'Lists Mautic push notifications.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists web push notifications with their sent counts. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'notifications',
			key: 'notifications',
			query: context.propsValue,
		});
	},
});
