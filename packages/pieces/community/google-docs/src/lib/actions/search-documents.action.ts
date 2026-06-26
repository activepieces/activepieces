import { googleDocsAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';

export const searchDocuments = createAction({
	auth: googleDocsAuth,
	name: 'search_documents',
	displayName: 'Search Documents',
	description:
		'Search Google Drive for Google Docs documents by name or full-text content.',
	audience: 'ai',
	aiMetadata: {
		description:
			"Searches Drive for Google Docs documents by name and/or full-text content, returning multiple ordered results with their IDs. Pick this over Find Document to discover documents by their content (not just an exact name) or to get more than one match; Find Document returns only the first name match and can also create-if-missing. Read-only and idempotent. At least one of name/content text is required.",
		idempotent: true,
	},
	props: {
		name_contains: Property.ShortText({
			displayName: 'Name Contains',
			description:
				'Return documents whose name contains this text. Provide this and/or Content Contains.',
			required: false,
		}),
		full_text_contains: Property.ShortText({
			displayName: 'Content Contains',
			description:
				'Return documents whose full text content contains this text. Provide this and/or Name Contains.',
			required: false,
		}),
		max_results: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of documents to return (1-100).',
			required: false,
			defaultValue: 10,
		}),
		order_by: Property.StaticDropdown({
			displayName: 'Order By',
			description: 'How to sort the results.',
			required: false,
			defaultValue: 'modifiedTime desc',
			options: {
				options: [
					{ label: 'Last modified (newest first)', value: 'modifiedTime desc' },
					{ label: 'Last modified (oldest first)', value: 'modifiedTime' },
					{ label: 'Created (newest first)', value: 'createdTime desc' },
					{ label: 'Created (oldest first)', value: 'createdTime' },
					{ label: 'Name (A-Z)', value: 'name' },
					{ label: 'Name (Z-A)', value: 'name desc' },
				],
			},
		}),
		page_token: Property.ShortText({
			displayName: 'Page Token',
			description:
				'Token for the next page of results, taken from the nextPageToken of a previous call. Leave empty for the first page.',
			required: false,
		}),
	},
	async run(context) {
		const { name_contains, full_text_contains, max_results, order_by, page_token } =
			context.propsValue;

		if (!name_contains && !full_text_contains) {
			throw new Error(
				'Provide at least one of "Name Contains" or "Content Contains" to search.'
			);
		}

		const pageSize = Math.min(Math.max(max_results ?? 10, 1), 100);

		const matchClauses: string[] = [];
		if (name_contains) {
			matchClauses.push(`name contains '${name_contains.replace(/'/g, "\\'")}'`);
		}
		if (full_text_contains) {
			matchClauses.push(
				`fullText contains '${full_text_contains.replace(/'/g, "\\'")}'`
			);
		}

		const query = [
			`mimeType='application/vnd.google-apps.document'`,
			`(${matchClauses.join(' or ')})`,
			'trashed=false',
		].join(' and ');

		const authClient = await createGoogleClient(context.auth);
		const drive = googleDrive({ version: 'v3', auth: authClient });

		try {
			const response = await drive.files.list({
				q: query,
				orderBy: order_by ?? 'modifiedTime desc',
				pageSize,
				pageToken: page_token || undefined,
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
				corpora: 'allDrives',
				fields:
					'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, webViewLink, owners(emailAddress))',
			});

			const documents = (response.data.files ?? []).map((file) => ({
				id: file.id ?? '',
				name: file.name ?? '',
				createdTime: file.createdTime ?? '',
				modifiedTime: file.modifiedTime ?? '',
				webViewLink: file.webViewLink ?? '',
				ownerEmail: file.owners?.[0]?.emailAddress ?? '',
			}));

			return {
				documents,
				count: documents.length,
				nextPageToken: response.data.nextPageToken ?? null,
			};
		} catch (e) {
			const error = e as { code?: number; message?: string };
			if (error.code === 403) {
				throw new Error(
					'Permission denied searching Drive. Ensure the connected account has Drive access.'
				);
			}
			throw e;
		}
	},
});
