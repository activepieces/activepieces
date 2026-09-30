import { createAction } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieDropdowns } from '../common/dropdowns';

export const deleteContractItem = createAction({
  auth: omieAuth,
  name: 'delete_contract_item',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contract Item',
  description: 'Removes one item from a service contract in Omie (Excluir Item do Contrato).',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove a single line item from an Omie service contract (ExcluirItem). The contract itself is kept. A retry fails because the item is already gone.',
    idempotent: false,
  },
  props: {
    contract: omieDropdowns.contractDropdown({
      displayName: 'Contract',
      description: 'The service contract that holds the item.',
      required: true,
    }),
    item: omieDropdowns.contractItemDropdown({
      displayName: 'Item',
      description: 'The contract item to remove.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return omieClient.call({
      auth,
      module: 'servicos/contrato',
      method: 'ExcluirItem',
      param: {
        contratoChave: { nCodCtr: propsValue.contract },
        ItensExclusao: [{ codItem: propsValue.item }],
      },
    });
  },
});
