import { createAction } from '@activepieces/pieces-framework';
import { etherscanAuth } from '../..';
import { etherscanRequest } from '../common/etherscan-api';

interface GasOracleResult {
  LastBlock: string;
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
  suggestBaseFee: string;
  gasUsedRatio: string;
}

export const getGasPrice = createAction({
  name: 'get_gas_price',
  displayName: 'Get Gas Price',
  description: 'Get current Ethereum network gas prices in Gwei.',
  auth: etherscanAuth,
  requireAuth: true,
  props: {},
  async run({ auth }) {
    const response = await etherscanRequest<GasOracleResult>(auth as string, {
      module: 'gastracker',
      action: 'gasoracle',
    });

    return {
      last_block: response.result.LastBlock,
      safe_gas_price_gwei: response.result.SafeGasPrice,
      proposed_gas_price_gwei: response.result.ProposeGasPrice,
      fast_gas_price_gwei: response.result.FastGasPrice,
      suggested_base_fee: response.result.suggestBaseFee,
    };
  },
});
