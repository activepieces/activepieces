import { createAction, Property } from '@activepieces/pieces-framework';
import { nansenAuth } from '../../index';
import { nansenRequest } from '../common/nansen-api';
import { CHAIN_OPTIONS } from '../common/chains-dropdown';
import { SMART_MONEY_LABEL_OPTIONS } from '../common/smart-money-labels';

export const getSmartMoneyDexTrades = createAction({
  auth: nansenAuth,
  name: 'get_smart_money_dex_trades',
  displayName: 'Get Smart Money DEX Trades',
  description: 'Monitor real-time DEX trades executed by smart money wallets.',
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
      defaultValue: 'Smart Trader',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of trades to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      chains: [context.propsValue.chain],
      limit: context.propsValue.limit || 50,
    };
    if (context.propsValue.label) {
      body['labels'] = [context.propsValue.label];
    }
    return nansenRequest(context.auth, '/smart-money/dex-trades', body);
  },
});
