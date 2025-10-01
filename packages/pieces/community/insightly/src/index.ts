import { createPiece } from '@activepieces/pieces-framework';
import { insightlyAuth } from './common/common';
import { createRecordAction } from './actions/create-record';
import { PieceCategory } from '@activepieces/shared';
import { updateRecordAction } from './actions/update-record';
import { getRecordAction } from './actions/get-record';
import { deleteRecordAction } from './actions/delete-record';
import { findRecordAction } from './actions/find-record';
import { newRecordTrigger } from './triggers/new-record';
import { updatedRecordTrigger } from './triggers/updated-record';
import { deletedRecordTrigger } from './triggers/deleted-record';


export const insightly = createPiece({
  displayName: 'Insightly',
  auth: insightlyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/insightly.png',
  authors: ['Ani-4x'],
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.PRODUCTIVITY],
  actions: [
    createRecordAction,
    updateRecordAction,
    getRecordAction,
    deleteRecordAction,
    findRecordAction,
  ],
  triggers: [
    newRecordTrigger,
    updatedRecordTrigger,
    deletedRecordTrigger,
  ],
});