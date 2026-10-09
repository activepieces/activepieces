import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetMarketingMessageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateMarketingMessageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_marketing_message',
	outputSchema: mauticGetMarketingMessageOutputSchema,
	displayName: 'Update Marketing Message',
	description: 'Updates fields of a Mautic marketing message.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing marketing message. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Marketing Message Id',
			description:
				'Numeric marketing message id, from List Marketing Messages or Create Marketing Message.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
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
		const { id, additionalFields, name, description, channels, isPublished, category } =
			context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'messages',
			id,
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
