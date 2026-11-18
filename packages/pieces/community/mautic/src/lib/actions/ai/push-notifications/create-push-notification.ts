import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreatePushNotificationOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreatePushNotificationAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_push_notification',
	outputSchema: mauticCreatePushNotificationOutputSchema,
	displayName: 'Create Push Notification',
	description: 'Creates a Mautic push notification.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a web push notification. Name, Heading and Message are required. Sending needs a push provider configured in Mautic.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		heading: Property.ShortText({ displayName: 'Heading', required: true }),
		message: Property.LongText({ displayName: 'Message', required: true }),
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
		const { additionalFields, name, heading, message, url, isPublished, category, language } =
			context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'notifications',
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
