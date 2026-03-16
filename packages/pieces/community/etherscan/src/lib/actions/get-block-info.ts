import { createAction, Property } from '@activepieces/pieces-framework';
import { etherscanAuth } from '../..';
import { etherscanRequest } from '../common/etherscan-api';

interface BlockReward {
  blockNumber: string;
  timeStamp: string;
  blockMiner: string;
  blockReward: string;
  uncles: unknown[];
  uncleInclusionReward: string;
}

export const getBlockInfo = createAction({
  name: 'get_block_info',
  displayName: 'Get Block Info',
  description:
    'Get block details by block number. Use the latest block number from gas price or supply your own.',
  auth: etherscanAuth,
  requireAuth: true,
  props: {
    blockNumber: Property.ShortText({
      displayName: 'Block Number',
      description: 'The block number to look up',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await etherscanRequest<BlockReward>(auth as string, {
      module: 'block',
      action: 'getblockreward',
      blockno: propsValue.blockNumber,
    });

    return {
      block_number: response.result.blockNumber,
      timestamp: response.result.timeStamp,
      miner: response.result.blockMiner,
      block_reward: response.result.blockReward,
      uncle_count: response.result.uncles.length,
      uncle_inclusion_reward: response.result.uncleInclusionReward,
    };
  },
});
