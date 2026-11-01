import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateEmailOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateEmailAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_email',
	outputSchema: mauticCreateEmailOutputSchema,
	displayName: 'Create Email',
	description: 'Creates a Mautic email.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an email. Name and Subject are required; set Email Type to "list" with Segment Ids for a segment email. Mautic sends it from campaigns, or as a segment email from the Mautic app.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Internal name of the email.',
			required: true,
		}),
		subject: Property.ShortText({ displayName: 'Subject', required: true }),
		customHtml: Property.LongText({
			displayName: 'HTML Body',
			description:
				'Full HTML content. Tokens like {contactfield=firstname} are replaced per contact.',
			required: false,
		}),
		plainText: Property.LongText({ displayName: 'Plain Text Body', required: false }),
		emailType: Property.StaticDropdown({
			displayName: 'Email Type',
			description:
				'Template emails go to single contacts and from campaigns; segment emails go to their segments.',
			required: false,
			options: {
				options: [
					{ label: 'Template (sent one by one)', value: 'template' },
					{ label: 'Segment (sent to segments)', value: 'list' },
				],
			},
		}),
		lists: Property.Array({
			displayName: 'Segment Ids',
			description: 'Segment ids a segment email is sent to, from List Segments.',
			required: false,
		}),
		fromAddress: Property.ShortText({ displayName: 'From Address', required: false }),
		fromName: Property.ShortText({ displayName: 'From Name', required: false }),
		replyToAddress: Property.ShortText({ displayName: 'Reply-To Address', required: false }),
		preheaderText: Property.ShortText({ displayName: 'Preheader Text', required: false }),
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
				'Other email properties, e.g. "bccAddress", "utmTags", "publishUp", "assetAttachments", "headers", "template". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			name,
			subject,
			customHtml,
			plainText,
			emailType,
			lists,
			fromAddress,
			fromName,
			replyToAddress,
			preheaderText,
			isPublished,
			category,
			language,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'emails',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('subject', subject),
				...spreadIfDefined('customHtml', customHtml),
				...spreadIfDefined('plainText', plainText),
				...spreadIfDefined('emailType', emailType),
				...spreadIfDefined('lists', lists),
				...spreadIfDefined('fromAddress', fromAddress),
				...spreadIfDefined('fromName', fromName),
				...spreadIfDefined('replyToAddress', replyToAddress),
				...spreadIfDefined('preheaderText', preheaderText),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('language', language),
			},
		});
	},
});
