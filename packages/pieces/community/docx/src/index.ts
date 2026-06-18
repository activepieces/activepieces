import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { docxAuth } from './lib/common/auth';
import { renderFacturx } from './lib/actions/render-facturx';
import { renderDocument } from './lib/actions/render-document';
import { uploadTemplate } from './lib/actions/upload-template';
import { updateTemplate } from './lib/actions/update-template';
import { restoreTemplateVersion } from './lib/actions/restore-template-version';
import { downloadTemplate } from './lib/actions/download-template';
import { downloadTemplateVersion } from './lib/actions/download-template-version';
import { deleteTemplate } from './lib/actions/delete-template';
import { listTemplates } from './lib/actions/list-templates';
import { listTemplateVersions } from './lib/actions/list-template-versions';
import { getUsageStats } from './lib/actions/get-usage-stats';

export const docx = createPiece({
  displayName: 'DocX',
  description:
    'Génère des documents (PDF / DOCX) et des factures Factur-X à partir de modèles Word, avec gestion de versions.',
  auth: docxAuth,
  minimumSupportedRelease: '0.36.0',
  logoUrl: 'https://dev.layerone.fr/logo.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['goprotect'],
  actions: [
    renderFacturx,
    renderDocument,
    uploadTemplate,
    updateTemplate,
    restoreTemplateVersion,
    downloadTemplate,
    downloadTemplateVersion,
    deleteTemplate,
    listTemplates,
    listTemplateVersions,
    getUsageStats,
  ],
  triggers: [],
});
