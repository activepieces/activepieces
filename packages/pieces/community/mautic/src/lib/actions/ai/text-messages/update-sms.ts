import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetSmsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateSmsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_sms',
	outputSchema: mauticGetSmsOutputSchema,
	displayName: 'Update Text Message',
	description: 'Updates fields of a Mautic text message.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing text message. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Text Message Id',
			description: 'Numeric text message id, from List Text Messages or Create Text Message.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Internal name of the text message.',
			required: false,
		}),
		message: Property.LongText({
			displayName: 'Message',
			description: 'Text to send. Tokens like {contactfield=firstname} are replaced per contact.',
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
				'Other text message properties, e.g. "publishUp", "publishDown", "smsType". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { id, additionalFields, name, message, isPublished, category, language } =
			context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'smses',
			id,
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
