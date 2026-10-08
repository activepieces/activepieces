import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetPushNotificationOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdatePushNotificationAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_push_notification',
	outputSchema: mauticGetPushNotificationOutputSchema,
	displayName: 'Update Push Notification',
	description: 'Updates fields of a Mautic push notification.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing web push notification. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Push Notification Id',
			description:
				'Numeric push notification id, from List Push Notifications or Create Push Notification.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		heading: Property.ShortText({ displayName: 'Heading', required: false }),
		message: Property.LongText({ displayName: 'Message', required: false }),
		url: Property.ShortText({
			displayName: 'URL',
			description: 'Page opened when the notification is clicked.',
			required: false,
		}),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Locale code, e.g. "en".',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other web push properties, e.g. "button", "utmTags", "publishUp", "publishDown". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { id, additionalFields, name, heading, message, url, isPublished, category, language } =
			context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'notifications',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('heading', heading),
				...spreadIfDefined('message', message),
				...spreadIfDefined('url', url),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
			},
		});
	},
});
