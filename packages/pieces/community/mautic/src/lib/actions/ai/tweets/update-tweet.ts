import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetTweetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateTweetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_tweet',
	outputSchema: mauticGetTweetOutputSchema,
	displayName: 'Update Tweet',
	description: 'Updates fields of a Mautic tweet.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing tweet template. Needs the Social plugin. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Tweet Id',
			description: 'Numeric tweet id, from List Tweets or Create Tweet.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		text: Property.LongText({
			displayName: 'Text',
			description: 'Tweet text, up to 280 characters.',
			required: false,
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
			id,
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
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'tweets',
			id,
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
