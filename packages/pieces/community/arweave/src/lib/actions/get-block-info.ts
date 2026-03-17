import { createAction, Property } from '@activepieces/pieces-framework';

export const getBlockInfo = createAction({
  name: 'getBlockInfo',
  displayName: 'Get Block Info',
  description: 'Fetch Arweave block details by block height or block hash.',
  auth: undefined,
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup By',
      description: 'Whether to look up the block by height or by hash.',
      required: true,
      defaultValue: 'height',
      options: {
        options: [
          { label: 'Block Height', value: 'height' },
          { label: 'Block Hash', value: 'hash' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Height or Hash',
      description: 'The block height (integer) or block hash (indep_hash).',
      required: true,
    }),
  },
  async run(context) {
    const { lookup_type, value } = context.propsValue;

    const endpoint =
      lookup_type === 'height'
        ? `https://arweave.net/block/height/${value.trim()}`
        : `https://arweave.net/block/hash/${value.trim()}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Block not found for ${lookup_type}: ${value}`);
      }
      throw new Error(`Arweave API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      nonce: string;
      previous_block: string;
      timestamp: number;
      last_retarget: number;
      diff: string;
      height: number;
      hash: string;
      indep_hash: string;
      txs: string[];
      reward_addr: string;
      tags: Array<{ name: string; value: string }>;
      reward_pool: string;
      weave_size: string;
      block_size: string;
    };

    return {
      height: data.height,
      indep_hash: data.indep_hash,
      hash: data.hash,
      previous_block: data.previous_block,
      timestamp: data.timestamp,
      timestamp_iso: new Date(data.timestamp * 1000).toISOString(),
      last_retarget: data.last_retarget,
      difficulty: data.diff,
      transactions: data.txs,
      transaction_count: data.txs ? data.txs.length : 0,
      reward_addr: data.reward_addr,
      reward_pool: data.reward_pool,
      weave_size: data.weave_size,
      block_size: data.block_size,
      tags: data.tags,
    };
  },
});
