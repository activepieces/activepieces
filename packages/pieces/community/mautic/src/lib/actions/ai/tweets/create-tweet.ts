import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateTweetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateTweetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_tweet',
	outputSchema: mauticCreateTweetOutputSchema,
	displayName: 'Create Tweet',
	description: 'Creates a Mautic tweet.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tweet template that campaigns can post. Name and Text are required. Needs the Social plugin.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		text: Property.LongText({
			displayName: 'Text',
			description: 'Tweet text, up to 280 characters.',
			required: true,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		asset: Property.Number({
			displayName: 'Asset Id',
			description: 'Asset to link, from List Assets.',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Landing Page Id',
			description: 'Landing page to link, from List Landing Pages.',
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
				'Other tweet properties, e.g. "publishUp", "publishDown". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			name,
			text,
			description,
			asset,
			page,
			isPublished,
			category,
			language,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'tweets',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('text', text),
				...spreadIfDefined('description', description),
				...spreadIfDefined('asset', asset),
				...spreadIfDefined('page', page),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
			},
		});
	},
});
