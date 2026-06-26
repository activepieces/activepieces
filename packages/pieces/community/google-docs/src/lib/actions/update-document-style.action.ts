import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const updateDocumentStyle = createAction({
	auth: googleDocsAuth,
	name: 'update_document_style',
	displayName: 'Update Document Style',
	description: 'Update the page margins or other document-level style properties of a Google Docs document.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates document-level style properties such as page margins. Only the properties you provide are changed — leave any margin empty to leave it unchanged. Re-applying the same values leaves the document in the same state, so it is idempotent. Use this to set consistent page margins before exporting or sharing a document.',
		idempotent: true,
	},
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description: 'The ID of the document whose style to update.',
			required: true,
		}),
		marginTopPt: Property.Number({
			displayName: 'Top Margin (pt)',
			description: 'Top page margin in points. Leave empty to keep the current value.',
			required: false,
		}),
		marginBottomPt: Property.Number({
			displayName: 'Bottom Margin (pt)',
			description: 'Bottom page margin in points. Leave empty to keep the current value.',
			required: false,
		}),
		marginLeftPt: Property.Number({
			displayName: 'Left Margin (pt)',
			description: 'Left page margin in points. Leave empty to keep the current value.',
			required: false,
		}),
		marginRightPt: Property.Number({
			displayName: 'Right Margin (pt)',
			description: 'Right page margin in points. Leave empty to keep the current value.',
			required: false,
		}),
	},
	async run(context) {
		const { documentId, marginTopPt, marginBottomPt, marginLeftPt, marginRightPt } = context.propsValue;

		const documentStyle: docs_v1.Schema$DocumentStyle = {};
		const fieldPaths: string[] = [];

		if (marginTopPt !== undefined && marginTopPt !== null) {
			documentStyle.marginTop = { magnitude: marginTopPt, unit: 'PT' };
			fieldPaths.push('marginTop');
		}
		if (marginBottomPt !== undefined && marginBottomPt !== null) {
			documentStyle.marginBottom = { magnitude: marginBottomPt, unit: 'PT' };
			fieldPaths.push('marginBottom');
		}
		if (marginLeftPt !== undefined && marginLeftPt !== null) {
			documentStyle.marginLeft = { magnitude: marginLeftPt, unit: 'PT' };
			fieldPaths.push('marginLeft');
		}
		if (marginRightPt !== undefined && marginRightPt !== null) {
			documentStyle.marginRight = { magnitude: marginRightPt, unit: 'PT' };
			fieldPaths.push('marginRight');
		}

		if (fieldPaths.length === 0) {
			throw new Error('At least one style property must be provided.');
		}

		const request: docs_v1.Schema$Request = {
			updateDocumentStyle: {
				documentStyle,
				fields: fieldPaths.join(','),
			},
		};

		const authClient = await createGoogleClient(context.auth);
		const docs = googleDocs({ version: 'v1', auth: authClient });

		try {
			await docs.documents.batchUpdate({
				documentId,
				requestBody: { requests: [request] },
			});
			return { success: true, documentId, updatedFields: fieldPaths };
		} catch (error) {
			throw new Error(docsCommon.formatError(error, 'update the style of'));
		}
	},
});
