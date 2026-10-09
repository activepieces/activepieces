import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateMarketingMessageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateMarketingMessageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_marketing_message',
	outputSchema: mauticCreateMarketingMessageOutputSchema,
	displayName: 'Create Marketing Message',
	description: 'Creates a Mautic marketing message.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a marketing message. Name is required; link an email, text message or web push per channel.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		channels: Property.Json({
			displayName: 'Channels',
			description:
				'Channel settings keyed by channel, e.g. {"email": {"channel": "email", "channelId": 12, "isEnabled": true}, "sms": {"channel": "sms", "channelId": 3, "isEnabled": false}}.',
			required: false,
		}),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other marketing message properties, e.g. "publishUp", "publishDown". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { additionalFields, name, description, channels, isPublished, category } =
			context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'messages',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('description', description),
				...spreadIfDefined('channels', channels),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
			},
		});
	},
});
