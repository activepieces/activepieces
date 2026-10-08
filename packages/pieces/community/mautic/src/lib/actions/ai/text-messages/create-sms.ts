import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateSmsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateSmsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_sms',
	outputSchema: mauticCreateSmsOutputSchema,
	displayName: 'Create Text Message',
	description: 'Creates a Mautic text message.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a text message template. Name and Message are required. Send it with Send Text Message to Contact.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Internal name of the text message.',
			required: true,
		}),
		message: Property.LongText({
			displayName: 'Message',
			description: 'Text to send. Tokens like {contactfield=firstname} are replaced per contact.',
			required: true,
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
				'Other text message properties, e.g. "publishUp", "publishDown", "smsType". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { additionalFields, name, message, isPublished, category, language } = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'smses',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('message', message),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
			},
		});
	},
});
