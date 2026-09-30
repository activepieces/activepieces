import { createAction } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieDropdowns } from '../common/dropdowns';

export const billServiceOrder = createAction({
  auth: omieAuth,
  name: 'bill_service_order',
  classification: 'WRITE',
  displayName: 'Bill Service Order',
  description:
    'Bills a service order in Omie (Faturar Ordem de Serviço). This can issue an NFS-e service invoice.',
  audience: 'both',
  aiMetadata: {
    description:
      'Bill an Omie service order (FaturarOS), which can issue an NFS-e invoice and create the receivable. Billing an already billed order fails, so do not retry blindly.',
    idempotent: false,
  },
  props: {
    service_order: omieDropdowns.serviceOrderDropdown({
      displayName: 'Service Order',
      description: 'The service order to bill.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return omieClient.call({
      auth,
      module: 'servicos/osp',
      method: 'FaturarOS',
      param: { nCodOS: propsValue.service_order },
    });
  },
});
