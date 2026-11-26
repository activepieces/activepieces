import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { renderDocumentAction } from './lib/actions/render-document';
import { uploadTemplateAction } from './lib/actions/upload-template';
import { deleteTemplateAction } from './lib/actions/delete-template';
import { updateTemplateAction } from './lib/actions/update-template';
import { listTemplatesAction } from './lib/actions/list-templates';
import { listCategoriesAction } from './lib/actions/list-categories';
import { listTagsAction } from './lib/actions/list-tags';
import { renderInlineTemplateAction } from './lib/actions/render-inline-template';
import { convertDocumentAction } from './lib/actions/convert-document';
import { getRenderResultAction } from './lib/actions/get-render-result';
import { downloadTemplateAction } from './lib/actions/download-template';
import { getTemplateAction } from './lib/actions/get-template';
import { listTemplateVersionsAction } from './lib/actions/list-template-versions';
import { getStatusAction } from './lib/actions/get-status';
import { carboneCustomApiCall } from './lib/actions/custom-api-call';
import { carboneAuth } from './lib/auth';

export const carbone = createPiece({
  displayName: 'Carbone',
  description:
    'Generate documents (PDF, DOCX, XLSX, ODS, and more) from templates and JSON data using the Carbone report generator.',
  auth: carboneAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/carbone.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['Harmatta', 'onyedikachi-david'],
  actions: [
    renderDocumentAction,
    renderInlineTemplateAction,
    convertDocumentAction,
    getRenderResultAction,
    uploadTemplateAction,
    downloadTemplateAction,
    getTemplateAction,
    listTemplateVersionsAction,
    deleteTemplateAction,
    updateTemplateAction,
    listTemplatesAction,
    listCategoriesAction,
    listTagsAction,
    getStatusAction,
    carboneCustomApiCall,
  ],
  triggers: [],
});
