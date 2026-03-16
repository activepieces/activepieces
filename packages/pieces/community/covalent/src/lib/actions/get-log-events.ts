import { createAction, Property } from '@activepieces/pieces-framework';
import { covalentAuth } from '../..';
import { covalentRequest } from '../common/covalent-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

interface LogEvent {
  block_signed_at: string;
  block_height: number;
  tx_hash: string;
  tx_offset: number;
  log_offset: number;
  sender_address: string;
  raw_log_topics: string[];
  sender_name: string | null;
  decoded: {
    name: string;
    signature: string;
    params: Array<{ name: string; type: string; decoded: boolean; value: string }>;
  } | null;
}

interface LogEventsResponse {
  updated_at: string;
  items: LogEvent[];
  pagination: {
    has_more: boolean;
    page_number: number;
    page_size: number;
    total_count: number | null;
  };
}

export const getLogEvents = createAction({
  name: 'get_log_events',
  displayName: 'Get Log Events',
  description:
    'Fetch smart contract log events for a given contract address across 100+ blockchains.',
  auth: covalentAuth,
  requireAuth: true,
  props: {
    contract_address: Property.ShortText({
      displayName: 'Contract Address',
      description: 'The contract address to retrieve log events for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of log events to return.',
      required: false,
      defaultValue: 10,
    }),
    chain_name: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query.',
      required: true,
      defaultValue: 'eth-mainnet',
      options: {
        options: CHAIN_OPTIONS,
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { contract_address, limit, chain_name } = propsValue;
    // Use a recent block window (last ~50,000 blocks ≈ ~7 days on Ethereum)
    // Covalent requires numeric block values; 'latest' is not a valid param
    const data = await covalentRequest<LogEventsResponse>(
      auth as string,
      `${chain_name}/events/address/${contract_address}/`,
      { 'page-size': String(limit ?? 10), 'page-number': '0' }
    );
    return {
      updated_at: data.updated_at,
      event_count: data.items.length,
      events: data.items,
      pagination: data.pagination,
    };
  },
});
