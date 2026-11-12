import { createPiece } from '@activepieces/pieces-framework';
import { gristCreateRecordAction } from './lib/actions/create-record.action';
import { gristUpdateRecordAction } from './lib/actions/update-record.action';
import { gristUploadAttachmentsToDocumnetAction } from './lib/actions/upload-attachments-to-document.action';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { gristNewRecordTrigger } from './lib/triggers/new-record.trigger';
import { gristUpdatedRecordTrigger } from './lib/triggers/updated-record.trigger';
import { gristSearchRecordAction } from './lib/actions/search-record.action';
import { gristListAttachmentsAction } from './lib/actions/ai/list-attachments.action';
import { gristDownloadAttachmentAction } from './lib/actions/ai/download-attachment.action';
import { gristDownloadAttachmentsArchiveAction } from './lib/actions/ai/download-attachments-archive.action';
import { gristUploadAttachmentAction } from './lib/actions/ai/upload-attachment.action';
import { gristRemoveUnusedAttachmentsAction } from './lib/actions/ai/remove-unused-attachments.action';
import { gristListColumnsAction } from './lib/actions/ai/list-columns.action';
import { gristAddColumnsAction } from './lib/actions/ai/add-columns.action';
import { gristUpdateColumnsAction } from './lib/actions/ai/update-columns.action';
import { gristDeleteColumnAction } from './lib/actions/ai/delete-column.action';
import { gristCreateDocumentAction } from './lib/actions/ai/create-document.action';
import { gristGetDocumentAction } from './lib/actions/ai/get-document.action';
import { gristUpdateDocumentAction } from './lib/actions/ai/update-document.action';
import { gristAddRecordsAction } from './lib/actions/ai/add-records.action';
import { gristUpdateRecordsAction } from './lib/actions/ai/update-records.action';
import { gristListRecordsAction } from './lib/actions/ai/list-records.action';
import { gristDeleteRecordsAction } from './lib/actions/ai/delete-records.action';
import { gristListTablesAction } from './lib/actions/ai/list-tables.action';
import { gristCreateTableAction } from './lib/actions/ai/create-table.action';
import { gristUpdateTableAction } from './lib/actions/ai/update-table.action';
import { gristRunSqlQueryAction } from './lib/actions/ai/run-sql-query.action';
import { gristListOrganizationsAction } from './lib/actions/ai/list-organizations.action';
import { gristGetOrgAccessAction } from './lib/actions/ai/get-org-access.action';
import { gristListWorkspacesAction } from './lib/actions/ai/list-workspaces.action';
import { gristAuth } from './lib/auth';
import { PieceCategory } from '@activepieces/pieces-framework';

export const grist = createPiece({
  displayName: 'Grist',
  auth: gristAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/grist.png',
  description: 'open source spreadsheet',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['kishanprmr'],
  actions: [
    gristCreateRecordAction,
    gristSearchRecordAction,
    gristUpdateRecordAction,
    gristUploadAttachmentsToDocumnetAction,
    gristAddRecordsAction,
    gristUpdateRecordsAction,
    gristListRecordsAction,
    gristDeleteRecordsAction,
    gristCreateDocumentAction,
    gristGetDocumentAction,
    gristUpdateDocumentAction,
    gristListTablesAction,
    gristCreateTableAction,
    gristUpdateTableAction,
    gristListColumnsAction,
    gristAddColumnsAction,
    gristUpdateColumnsAction,
    gristDeleteColumnAction,
    gristListAttachmentsAction,
    gristDownloadAttachmentAction,
    gristDownloadAttachmentsArchiveAction,
    gristUploadAttachmentAction,
    gristRemoveUnusedAttachmentsAction,
    gristRunSqlQueryAction,
    gristListOrganizationsAction,
    gristGetOrgAccessAction,
    gristListWorkspacesAction,
    createCustomApiCallAction({
      auth: gristAuth,
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        return `${auth.props.domain}/api/`;
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.apiKey}`,
      }),
    }),
  ],
  triggers: [gristNewRecordTrigger, gristUpdatedRecordTrigger],
});

export { gristAuth };
