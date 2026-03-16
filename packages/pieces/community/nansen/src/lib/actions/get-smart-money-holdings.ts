import { createAction, Property } from '@activepieces/pieces-framework';
import { nansenAuth } from '../../index';
import { nansenRequest } from '../common/nansen-api';
import { CHAIN_OPTIONS } from '../common/chains-dropdown';
import { SMART_MONEY_LABEL_OPTIONS } from '../common/smart-money-labels';

export const getSmartMoneyHoldings = createAction({
  auth: nansenAuth,
  name: 'get_smart_money_holdings',
  displayName: 'Get Smart Money Holdings',
  description: 'Get aggregated token holdings across smart money wallets (institutional funds, top traders).',
  props: {
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'Blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
      defaultValue: 'ethereum',
    }),
    label: Property.StaticDropdown({
      displayName: 'Smart Money Type',
      description: 'Filter by type of smart money wallet',
      required: false,
      options: { options: SMART_MONEY_LABEL_OPTIONS },
      defaultValue: 'Fund',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      chains: [context.propsValue.chain],
    };
    if (context.propsValue.label) {
      body['labels'] = [context.propsValue.label];
    }
    return nansenRequest(context.auth, '/smart-money/holdings', body);
  },
});
