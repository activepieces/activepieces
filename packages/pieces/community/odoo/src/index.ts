import { createPiece } from '@activepieces/pieces-framework';
import actions from './lib/actions';
import { odooAuth } from './lib/auth';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newLeadTrigger } from './lib/triggers/new-lead';
import { newOrUpdatedRecordTrigger } from './lib/triggers/new-or-updated-record';
import { newRecordTrigger } from './lib/triggers/new-record';
import { newSalesOrderTrigger } from './lib/triggers/new-sales-order';

export const odoo = createPiece({
  displayName: 'Odoo',
  description: 'Open source all-in-one management software',
  auth: odooAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/odoo.png',
  authors: ["mariomeyer","kishanprmr","abuaboud"],
  actions,
  triggers: [
    newRecordTrigger,
    newOrUpdatedRecordTrigger,
    newContactTrigger,
    newLeadTrigger,
    newSalesOrderTrigger,
  ],
});
