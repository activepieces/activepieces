import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { flattenDoc } from '../common';
import { documentIdProp } from '../common/props';

export const findAndReplaceText = createAction({
	auth: googleDocsAuth,
	name: 'find_and_replace_text',
	displayName: 'Find and Replace Text',
	description: 'Find all occurrences of a piece of text in a document and replace them.',
	props: {
		documentId: documentIdProp('Document', 'The Google Doc to search in.'),
		findText: Property.ShortText({
			displayName: 'Find Text',
			description: 'The text to search for.',
			required: true,
		}),
		replaceText: Property.LongText({
			displayName: 'Replace With',
			description: 'The replacement text (leave empty to delete the found text).',
			required: false,
		}),
		matchCase: Property.Checkbox({
			displayName: 'Match case',
			description: 'When enabled, the search is case-sensitive.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { documentId, findText, replaceText, matchCase } = context.propsValue;

		const authClient = await createGoogleClient(context.auth);
		const docs = google.docs({ version: 'v1', auth: authClient });

		const response = await docs.documents.batchUpdate({
			documentId,
			requestBody: {
				requests: [
					{
						replaceAllText: {
							containsText: {
								text: findText,
								matchCase: matchCase ?? false,
							},
							replaceText: replaceText ?? '',
						},
					},
				],
			},
		});

		const occurrencesChanged = response.data.replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;
		const finalDoc = await docs.documents.get({ documentId });

		return {
			occurrencesChanged,
			...flattenDoc(finalDoc.data),
		};
	},
});
