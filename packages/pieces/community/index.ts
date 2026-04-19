import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { ninjapipeAuth } from './lib/auth';
import { createRecord } from './lib/actions/create-record';
import { getRecord } from './lib/actions/get-record';
import { listRecords } from './lib/actions/list-records';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { discoverFields } from './lib/actions/discover-fields';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { createOrUpdateCompany } from './lib/actions/create-or-update-company';
import { enableClientPortal } from './lib/actions/enable-client-portal';
import { disableClientPortal } from './lib/actions/disable-client-portal';
import { createBudgetExpense } from './lib/actions/create-budget-expense';
import { sendToDatabin } from './lib/actions/send-to-databin';
import { newRecord } from './lib/triggers/new-record.trigger';

export const ninjapipe = createPiece({
  displayName: 'NinjaPipe',
  description: 'CRM, pipelines, contacts, deals, invoices and more',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://ninjapipe.app/logo512.png',  // 512x512px, wird von ActivePieces automatisch skaliert
  categories: [PieceCategory.SALES_AND_CRM],
  auth: ninjapipeAuth,
  authors: ['hemmilicious'],
  actions: [
    createRecord,
    getRecord,
    listRecords,
    updateRecord,
    deleteRecord,
    discoverFields,
    createOrUpdateContact,
    createOrUpdateCompany,
    enableClientPortal,
    disableClientPortal,
    createBudgetExpense,
    sendToDatabin,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { base_url: string }).base_url,
      auth: ninjapipeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { api_key: string }).api_key}`,
      }),
    }),
  ],
  triggers: [
    newRecord,
  ],
});
