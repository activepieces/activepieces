import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { renderDocumentAction } from './lib/actions/render-document';
import { uploadTemplateAction } from './lib/actions/upload-template';
import { deleteTemplateAction } from './lib/actions/delete-template';
import { updateTemplateAction } from './lib/actions/update-template';
import { listTemplatesAction } from './lib/actions/list-templates';
import { listCategoriesAction } from './lib/actions/list-categories';
import { listTagsAction } from './lib/actions/list-tags';

export const carboneAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
To get your Carbone API key:
1. Log in to your [Carbone account](https://account.carbone.io/)
2. Navigate to **API keys** in your account settings
3. Create or copy your API key
`,
});

export const carbone = createPiece({
  displayName: 'Carbone',
  description:
    'Generate documents (PDF, DOCX, XLSX, ODS, and more) from templates and JSON data using the Carbone report generator. V5 features: versioning, metadata, categories/tags, and advanced PDF converters.',
  auth: carboneAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/carbone.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['Harmatta', 'onyedikachi-david'],
  actions: [
    renderDocumentAction,
    uploadTemplateAction,
    deleteTemplateAction,
    updateTemplateAction,
    listTemplatesAction,
    listCategoriesAction,
    listTagsAction,
  ],
  triggers: [],
});
