import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { twentyAuth } from './lib/auth';
import { twentyClient } from './lib/common/client';
import { createContactAction } from './lib/actions/create-contact';
import { createCompanyAction } from './lib/actions/create-company';
import { createOpportunityAction } from './lib/actions/create-opportunity';
import { findPersonAction } from './lib/actions/find-person';
import { findCompanyAction } from './lib/actions/find-company';
import { updatePersonAction } from './lib/actions/update-person';
import { updateCompanyAction } from './lib/actions/update-company';
import { twentyAiActions } from './lib/actions/ai';
import { newPersonTrigger } from './lib/triggers/new-person';
import { newCompanyTrigger } from './lib/triggers/new-company';
import { findRecords } from './lib/actions/find-records';
import { updateRecord } from './lib/actions/update-record';
import { createRecord } from './lib/actions/create-record';
import { createOrUpdateRecords } from './lib/actions/create-or-update-records';
import { deleteRecords } from './lib/actions/delete-records';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';
import { deletedRecordTrigger } from './lib/triggers/deleted-record';

export { twentyAuth };

export const twenty = createPiece({
  displayName: 'Twenty',
  description: 'Open-source CRM platform.',
  auth: twentyAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/twenty.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['Akash5908', 'bjacobs42'],
  actions: [
    createRecord,
    createContactAction,
    createCompanyAction,
    createOpportunityAction,
    createOrUpdateRecords,
    findRecords,
    findPersonAction,
    findCompanyAction,
    updateRecord,
    updatePersonAction,
    updateCompanyAction,
    deleteRecords,
    ...twentyAiActions,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? twentyClient.baseUrl({ auth }) : ''),
      auth: twentyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.api_key}`,
      }),
    }),
  ],
  triggers: [
    newPersonTrigger,
    newCompanyTrigger,
    newRecordTrigger,
    updatedRecordTrigger,
    deletedRecordTrigger,
  ],
});
