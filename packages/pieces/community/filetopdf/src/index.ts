import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { filetopdfAuth } from './lib/auth';
import { convertFileAction } from './lib/actions/convert-file';
import { convertHtmlAction } from './lib/actions/convert-html';
import { convertMarkdownAction } from './lib/actions/convert-markdown';
import { getAccountAction } from './lib/actions/get-account';
import { filetopdfAiActions } from './lib/actions/ai';

export const filetopdf = createPiece({
  displayName: 'FileToPDF',
  description:
    'Convert files, HTML, and Markdown to PDF. Office documents (DOCX, XLSX, PPTX), images, web pages, and Markdown become clean PDFs over a simple API.',
  auth: filetopdfAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/filetopdf.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['FileToPDF'],
  actions: [
    convertFileAction,
    convertHtmlAction,
    convertMarkdownAction,
    getAccountAction,
    ...filetopdfAiActions,
  ],
  triggers: [],
});
