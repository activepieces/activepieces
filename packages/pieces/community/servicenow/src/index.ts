import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { servicenowAuth } from './auth';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { getRecord } from './lib/actions/get-record';
import { attachFileToRecord } from './lib/actions/attach-file-to-record';
import { findRecord } from './lib/actions/find-record';
import { findFile } from './lib/actions/find-file';
import { newRecord } from './lib/triggers/new-record';
import { updatedRecord } from './lib/triggers/updated-record';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const servicenow = createPiece({
  displayName: 'ServiceNow',
  description: 'IT service management, operations, HR, security, and custom business workflows',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/servicenow.png',
  authors: ['anantkumar'],
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.BUSINESS_INTELLIGENCE],
  auth: servicenowAuth,
  actions: [
    createRecord,
    updateRecord,
    getRecord,
    attachFileToRecord,
    findRecord,
    findFile,
    createCustomApiCallAction({
      baseUrl: (auth) => `${auth.instanceUrl}/api/now`,
      auth: servicenowAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    }),
  ],
  triggers: [
    newRecord,
    updatedRecord,
  ],
});
