import { createAction, Property } from '@activepieces/pieces-framework';
import { graphAuth } from '../..';
import { graphRequest } from '../common/graph-api';
import { NETWORK_OPTIONS } from '../common/network-dropdown';

interface DexSwap {
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  sender: string;
  recipient: string;
  input_contract: string;
  output_contract: string;
  input_amount: string;
  output_amount: string;
  protocol?: string;
}

interface DexSwapsResponse {
  swaps: DexSwap[];
  total: number;
}

export const getDexSwaps = createAction({
  name: 'get_dex_swaps',
  displayName: 'Get DEX Swaps',
  description:
    'Get DEX swap transactions from Uniswap and other major protocols (Balancer, Curve, Bancor).',
  auth: graphAuth,
  requireAuth: true,
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The EVM network to query.',
      required: true,
      defaultValue: 'mainnet',
      options: {
        options: NETWORK_OPTIONS,
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 10,
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient Address (Optional)',
      description: 'Filter swaps by recipient wallet address.',
      required: false,
    }),
    input_contract: Property.ShortText({
      displayName: 'Input Token Contract (Optional)',
      description: 'Filter by the contract address of the input token.',
      required: false,
    }),
    output_contract: Property.ShortText({
      displayName: 'Output Token Contract (Optional)',
      description: 'Filter by the contract address of the output token.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { network, limit, recipient, input_contract, output_contract } = propsValue;
    const params: Record<string, string> = {
      network: network as string,
      limit: String(limit ?? 10),
    };
    if (recipient) params['recipient'] = recipient as string;
    if (input_contract) params['input_contract'] = input_contract as string;
    if (output_contract) params['output_contract'] = output_contract as string;

    const data = await graphRequest<DexSwapsResponse>(
      auth as string,
      '/v1/evm/swaps',
      params
    );
    return data;
  },
});
