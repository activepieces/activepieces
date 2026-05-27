import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { amazonTextractAuth } from './lib/auth';
import { analyzeDocument } from './lib/actions/analyze-document';
import { detectDocumentText } from './lib/actions/detect-document-text';
import { analyzeExpense } from './lib/actions/analyze-expense';
import { analyzeId } from './lib/actions/analyze-id';
import { analyzeDocumentAsync } from './lib/actions/analyze-document-async';

export const amazonTextract = createPiece({
  displayName: 'AWS Textract',
  description:
    'Extract text, forms, tables, signatures, and structured data from documents using AWS Textract.',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-textract.png',
  minimumSupportedRelease: '0.30.0',
  authors: ["AhmadTash"],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: amazonTextractAuth,
  actions: [
    analyzeDocument,
    detectDocumentText,
    analyzeExpense,
    analyzeId,
    analyzeDocumentAsync,
  ],
  triggers: [],
});

