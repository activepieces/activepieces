import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { servicenowAuth } from './lib/common/props';
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { getRecordAction } from './lib/actions/get-record';
import { findRecordAction } from './lib/actions/find-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { attachFileToRecordAction } from './lib/actions/attach-file-to-record';
import { findFileAction } from './lib/actions/find-file';
import { deleteAttachmentAction } from './lib/actions/delete-attachment';
import { addCommentAction } from './lib/actions/add-comment';
import { resolveIncidentAction } from './lib/actions/resolve-incident';
import { submitCatalogItemAction } from './lib/actions/submit-catalog-item';
import { getCatalogItemAction } from './lib/actions/get-catalog-item';
import { searchKnowledgeArticlesAction } from './lib/actions/search-knowledge-articles';
import { getKnowledgeArticleAction } from './lib/actions/get-knowledge-article';
import { sendEmailAction } from './lib/actions/send-email';
import { countRecordsAction } from './lib/actions/count-records';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';
import { newCommentTrigger } from './lib/triggers/new-comment';

export const serviceNow = createPiece({
  displayName: 'ServiceNow',
  description:
    'Enterprise IT service management platform for incident, change, and service request management',
  auth: servicenowAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/service-now.png',
  authors: ['sparkybug'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createRecordAction,
    updateRecordAction,
    getRecordAction,
    findRecordAction,
    deleteRecordAction,
    addCommentAction,
    resolveIncidentAction,
    attachFileToRecordAction,
    findFileAction,
    deleteAttachmentAction,
    getCatalogItemAction,
    submitCatalogItemAction,
    searchKnowledgeArticlesAction,
    getKnowledgeArticleAction,
    sendEmailAction,
    countRecordsAction,
    createCustomApiCallAction({
      auth: servicenowAuth,
      baseUrl: (auth) =>
        auth ? auth.props.instanceUrl.replace(/\/$/, '') : '',
      authMapping: async (auth) => {
        const credentials = Buffer.from(
          `${auth.props.username}:${auth.props.password}`
        ).toString('base64');
        return {
          Authorization: `Basic ${credentials}`,
        };
      },
    }),
  ],
  triggers: [newRecordTrigger, updatedRecordTrigger, newCommentTrigger],
});
