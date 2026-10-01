import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { omieAuth } from './lib/auth';
import { billServiceOrder } from './lib/actions/bill-service-order';
import { callOmieMethod } from './lib/actions/call-omie-method';
import { createClient } from './lib/actions/create-client';
import { createPayable } from './lib/actions/create-payable';
import { createServiceContract } from './lib/actions/create-service-contract';
import { createServiceOrder } from './lib/actions/create-service-order';
import { deleteContractItem } from './lib/actions/delete-contract-item';
import { listClients } from './lib/actions/list-clients';
import { listFinancialMovements } from './lib/actions/list-financial-movements';
import { updateClient } from './lib/actions/update-client';
import { newClient } from './lib/triggers/new-client';
import { newFinancialMovement } from './lib/triggers/new-financial-movement';
import { newServiceContract } from './lib/triggers/new-service-contract';
import { omieWebhook } from './lib/triggers/omie-webhook';
import { updatedClient } from './lib/triggers/updated-client';
import { updatedFinancialMovement } from './lib/triggers/updated-financial-movement';
import { updatedServiceContract } from './lib/triggers/updated-service-contract';

export const omie = createPiece({
  displayName: 'Omie',
  description:
    'Brazilian cloud ERP. Manage clients, service contracts and orders, payables and financial movements.',
  auth: omieAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/omie.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['kishanparmar'],
  actions: [
    createClient,
    updateClient,
    listClients,
    deleteContractItem,
    createServiceContract,
    createServiceOrder,
    billServiceOrder,
    createPayable,
    listFinancialMovements,
    callOmieMethod,
    createCustomApiCallAction({
      baseUrl: () => 'https://app.omie.com.br/api/v1',
      auth: omieAuth,
      description:
        'Make a raw request to the Omie API. Omie reads app_key and app_secret from the JSON body, so include them there. To reuse your connection automatically, use Call Omie Method instead.',
    }),
  ],
  triggers: [
    newClient,
    updatedClient,
    newFinancialMovement,
    updatedFinancialMovement,
    newServiceContract,
    updatedServiceContract,
    omieWebhook,
  ],
});
