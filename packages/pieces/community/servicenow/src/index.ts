import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { servicenowAuth } from './lib/common/common';
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { attachFileAction } from './lib/actions/attach-file-to-record';
import { getRecordAction } from './lib/actions/get-record';
import { findRecordAction } from './lib/actions/find-record';
import { findFileAction } from './lib/actions/find-file';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';


export const servicenow = createPiece({
  displayName: 'ServiceNow',
  auth: servicenowAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/servicenow.png',
  authors: ['Ani-4x'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  actions: [
    createRecordAction,
    updateRecordAction,
    attachFileAction,
    getRecordAction,
    findRecordAction,
    findFileAction,
  ],
  triggers: [
    newRecordTrigger,
    updatedRecordTrigger,
  ],
});