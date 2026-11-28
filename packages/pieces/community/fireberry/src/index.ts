import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record.action';
import { updateRecordAction } from './lib/actions/update-record.action';
import { deleteRecordAction } from './lib/actions/delete-record.action';
import { findRecordAction } from './lib/actions/find-record.action';
import { aiListObjectTypesAction } from './lib/actions/ai/list-object-types.action';
import { aiListObjectFieldsAction } from './lib/actions/ai/list-object-fields.action';
import { aiListPicklistValuesAction } from './lib/actions/ai/list-picklist-values.action';
import { aiSearchRecordsAction } from './lib/actions/ai/search-records.action';
import { aiGetRecordAction } from './lib/actions/ai/get-record.action';
import { aiCreateRecordAction } from './lib/actions/ai/create-record.action';
import { aiUpdateRecordAction } from './lib/actions/ai/update-record.action';
import { aiDeleteRecordAction } from './lib/actions/ai/delete-record.action';
import { recordCreatedOrUpdatedTrigger } from './lib/triggers/record-created-updated.trigger';
import { fireberryAuth } from './lib/auth';

export const fireberry = createPiece({
  displayName: 'Fireberry',
  auth: fireberryAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/fireberry.png',
  authors: ['sparkybug', 'onyedikachi-david', 'OdaiAhmed99'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    createRecordAction,
    updateRecordAction,
    deleteRecordAction,
    findRecordAction,
    aiListObjectTypesAction,
    aiListObjectFieldsAction,
    aiListPicklistValuesAction,
    aiSearchRecordsAction,
    aiGetRecordAction,
    aiCreateRecordAction,
    aiUpdateRecordAction,
    aiDeleteRecordAction,
  ],
  triggers: [recordCreatedOrUpdatedTrigger],
});
