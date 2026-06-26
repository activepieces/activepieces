import { googleDocsAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs } from '@googleapis/docs';

export const replaceAllText = createAction({
	auth: googleDocsAuth,
	name: 'replace_all_text',
	displayName: 'Replace All Text in Document',
	description:
		'Replace every occurrence of a literal string in a Google Docs document with another string.',
	audience: 'ai',
	aiMetadata: {
		// Idempotent matches the sibling create_document_based_on_template, which
		// wraps the identical replaceAllText request and is labeled idempotent:true:
		// re-running with the same find/replace leaves the same end state (the
		// second run matches zero occurrences). Caveat noted below for the
		// overlapping find/replace-literals edge case.
		description:
			'Find-and-replaces every occurrence of a literal string across a whole Google Docs document. Pick this for a bare ad-hoc text edit; use Edit Template File instead for placeholder-token merges or image swaps. Idempotent for normal use (a repeat run matches nothing and leaves the same end state); the exception is overlapping find/replace literals (e.g. replacing "a" with "ab"), which can re-match on a second run.',
		idempotent: true,
	},
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description:
				"The ID of the document to edit, found in its URL: 'https://docs.google.com/document/d/<documentId>/edit'.",
			required: true,
		}),
		find_text: Property.ShortText({
			displayName: 'Find Text',
			description: 'The literal text to search for in the document.',
			required: true,
		}),
		replace_text: Property.ShortText({
			displayName: 'Replace With',
			description: 'The text to replace every matched occurrence with.',
			required: true,
		}),
		match_case: Property.Checkbox({
			displayName: 'Match Case',
			description: 'When enabled, the search is case-sensitive.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { documentId, find_text, replace_text, match_case } =
			context.propsValue;

		const authClient = await createGoogleClient(context.auth);
		const docs = googleDocs({ version: 'v1', auth: authClient });

		try {
			const response = await docs.documents.batchUpdate({
				documentId,
				requestBody: {
					requests: [
						{
							replaceAllText: {
								containsText: {
									text: find_text,
									matchCase: match_case ?? false,
								},
								replaceText: replace_text,
							},
						},
					],
				},
			});

			const occurrencesChanged =
				response.data.replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;

			return {
				documentId,
				occurrencesChanged,
			};
		} catch (e) {
			const error = e as { code?: number; message?: string };
			if (error.code === 403) {
				throw new Error(
					'Permission denied editing the document. Ensure the connected account has edit access to this document.'
				);
			}
			if (error.code === 404) {
				throw new Error(
					`Document not found for ID '${documentId}'. Verify the document ID.`
				);
			}
			throw e;
		}
	},
});
