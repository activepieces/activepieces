import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createAppointment } from './lib/actions/create-appointment';
import { createClient } from './lib/actions/create-client';
import { createInvoice } from './lib/actions/create-invoice';
import { createTask } from './lib/actions/create-task';
import { findClient } from './lib/actions/find-client';
import { sendInvoice } from './lib/actions/send-invoice';
import { genayaAuth } from './lib/auth';
import { genayaApi } from './lib/common/client';
import { invoicePaid } from './lib/triggers/invoice-paid';
import { newAppointment } from './lib/triggers/new-appointment';
import { newClient } from './lib/triggers/new-client';
import { newLead } from './lib/triggers/new-lead';
import { paymentReceived } from './lib/triggers/payment-received';

export const genaya = createPiece({
  displayName: 'Genaya',
  description:
    'Operations platform for service businesses: clients, scheduling, leads, invoices, payments and tasks in one place.',
  auth: genayaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/genaya.png',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.PRODUCTIVITY],
  authors: ['genaya-app'],
  actions: [
    createClient,
    findClient,
    createAppointment,
    createInvoice,
    sendInvoice,
    createTask,
    createCustomApiCallAction({
      baseUrl: () => genayaApi.BASE_URL,
      auth: genayaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newClient, newAppointment, invoicePaid, paymentReceived, newLead],
});
