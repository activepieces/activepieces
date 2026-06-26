import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createDocument } from './lib/actions/create-document';
import { createDocumentBasedOnTemplate } from './lib/actions/create-document-based-on-template.action';
import { readDocument } from './lib/actions/read-document.action';
import { appendText } from './lib/actions/append-text';
import { findDocumentAction } from './lib/actions/find-document';
import { getDocumentPlaintext } from './lib/actions/get-document-plaintext.action';
import { replaceAllText } from './lib/actions/replace-all-text.action';
import { searchDocuments } from './lib/actions/search-documents.action';
import { copyDocument } from './lib/actions/copy-document.action';
import { getDocument } from './lib/actions/get-document.action';
import { createTextDocument } from './lib/actions/create-text-document.action';
import { getDocumentEndIndex } from './lib/actions/get-document-end-index.action';
import { insertText } from './lib/actions/insert-text.action';
import { deleteContentRange } from './lib/actions/delete-content-range.action';
import { createDocumentFromMarkdown } from './lib/actions/create-document-from-markdown.action';
import { createFooter } from './lib/actions/create-footer.action';
import { createFootnote } from './lib/actions/create-footnote.action';
import { createHeader } from './lib/actions/create-header.action';
import { createNamedRange } from './lib/actions/create-named-range.action';
import { createParagraphBullets } from './lib/actions/create-paragraph-bullets.action';
import { deleteFooter } from './lib/actions/delete-footer.action';
import { deleteHeader } from './lib/actions/delete-header.action';
import { deleteNamedRange } from './lib/actions/delete-named-range.action';
import { deleteParagraphBullets } from './lib/actions/delete-paragraph-bullets.action';
import { deleteTableColumn } from './lib/actions/delete-table-column.action';
import { deleteTableRow } from './lib/actions/delete-table-row.action';
import { insertTable } from './lib/actions/insert-table.action';
import { insertTableColumn } from './lib/actions/insert-table-column.action';
import { insertTableRow } from './lib/actions/insert-table-row.action';
import { insertTextInTableCell } from './lib/actions/insert-text-in-table-cell.action';
import { insertImageInTableCell } from './lib/actions/insert-image-in-table-cell.action';
import { unmergeTableCells } from './lib/actions/unmerge-table-cells.action';
import { updateTableRowStyle } from './lib/actions/update-table-row-style.action';
import { insertInlineImage } from './lib/actions/insert-inline-image.action';
import { insertPageBreak } from './lib/actions/insert-page-break.action';
import { replaceImage } from './lib/actions/replace-image.action';
import { updateDocumentStyle } from './lib/actions/update-document-style.action';
import { exportAsPdf } from './lib/actions/export-as-pdf.action';
import { createAndPopulateTable } from './lib/actions/create-and-populate-table.action';
import { replaceBodyWithMarkdown } from './lib/actions/replace-body-with-markdown.action';
import { replaceSectionWithMarkdown } from './lib/actions/replace-section-with-markdown.action';
import { batchUpdate } from './lib/actions/batch-update.action';
import { newDocumentTrigger } from './lib/triggers/new-document';
import { googleDocsAuth, getAccessToken, GoogleDocsAuthValue } from './lib/auth';

export { googleDocsAuth, getAccessToken, GoogleDocsAuthValue } from './lib/auth';

export const googleDocs = createPiece({
	displayName: 'Google Docs',
	description: 'Create and edit documents online',
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-docs.png',
	categories: [PieceCategory.CONTENT_AND_FILES],
	authors: [
		'pfernandez98',
		'kishanprmr',
		'MoShizzle',
		'khaledmashaly',
		'abuaboud',
		'AbdullahBitar',
		'Kevinyu-alan'
	],
	auth: googleDocsAuth,
	actions: [
		createDocument,
		createDocumentBasedOnTemplate,
		readDocument,
		findDocumentAction,
		getDocumentPlaintext,
		replaceAllText,
		searchDocuments,
		copyDocument,
		getDocumentEndIndex,
		insertText,
		deleteContentRange,
		createDocumentFromMarkdown,
		getDocument,
		createTextDocument,
		createFooter,
		createFootnote,
		createHeader,
		createNamedRange,
		createParagraphBullets,
		deleteFooter,
		deleteHeader,
		deleteNamedRange,
		deleteParagraphBullets,
		deleteTableColumn,
		deleteTableRow,
		insertTable,
		insertTableColumn,
		insertTableRow,
		insertTextInTableCell,
		insertImageInTableCell,
		unmergeTableCells,
		updateTableRowStyle,
		insertInlineImage,
		insertPageBreak,
		replaceImage,
		updateDocumentStyle,
		exportAsPdf,
		createAndPopulateTable,
		replaceBodyWithMarkdown,
		replaceSectionWithMarkdown,
		batchUpdate,
		createCustomApiCallAction({
			baseUrl: () => 'https://docs.googleapis.com/v1',
			auth: googleDocsAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${await getAccessToken(auth as GoogleDocsAuthValue)}`,
			}),
		}),
		appendText,
	],
	triggers: [newDocumentTrigger],
});
