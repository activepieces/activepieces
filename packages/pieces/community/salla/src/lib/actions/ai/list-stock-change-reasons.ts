import { createAction } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { sallaProducts } from '../../common/products';

export const aiListStockChangeReasonsAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_stock_change_reasons',
  classification: 'SEARCH',
  displayName: 'List Stock Change Reasons',
  description: 'Lists the reasons the store offers for a stock change.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the stock change reasons configured in the Salla store (for example correction or damaged) with their id and name. Call it to get the reason_id that Adjust Stock and Update Variant accept; the reason is optional, so skip this when no reason is needed. Names come back in the connection language (Arabic by default).',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.stockChangeReasons,
  props: {},
  async run({ auth }) {
    return sallaProducts.listStockChangeReasons({ auth });
  },
});
