import { createPiece } from '@activepieces/pieces-framework';
import { gristCreateRecordAction } from './lib/actions/create-record.action';
import { gristUpdateRecordAction } from './lib/actions/update-record.action';
import { gristUploadAttachmentsToDocumnetAction } from './lib/actions/upload-attachments-to-document.action';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { gristNewRecordTrigger } from './lib/triggers/new-record.trigger';
import { gristUpdatedRecordTrigger } from './lib/triggers/updated-record.trigger';
import { gristSearchRecordAction } from './lib/actions/search-record.action';
import {
  gristAddRecordsAction,
  gristDeleteRecordsAction,
  gristListRecordsAction,
  gristUpdateRecordsAction,
} from './lib/actions/ai/records';
import {
  gristCreateDocumentAction,
  gristGetDocumentAction,
  gristUpdateDocumentAction,
} from './lib/actions/ai/documents';
import {
  gristCreateTableAction,
  gristListTablesAction,
  gristUpdateTableAction,
} from './lib/actions/ai/tables';
import {
  gristAddColumnsAction,
  gristDeleteColumnAction,
  gristListColumnsAction,
  gristUpdateColumnsAction,
} from './lib/actions/ai/columns';
import {
  gristDownloadAttachmentAction,
  gristDownloadAttachmentsArchiveAction,
  gristListAttachmentsAction,
  gristRemoveUnusedAttachmentsAction,
  gristUploadAttachmentAction,
} from './lib/actions/ai/attachments';
import {
  gristGetOrgAccessAction,
  gristListOrganizationsAction,
  gristListWorkspacesAction,
  gristRunSqlQueryAction,
} from './lib/actions/ai/workspace';
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
        return `${
          auth.props.domain
        }/api/`;
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${
          auth.props.apiKey
        }`,
      }),
    }),
  ],
  triggers: [gristNewRecordTrigger, gristUpdatedRecordTrigger],
});

export { gristAuth };
