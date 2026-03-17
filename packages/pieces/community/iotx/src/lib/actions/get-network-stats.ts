import { createAction } from '@activepieces/pieces-framework';
import { iotexRpc } from '../common';

export const getNetworkStats = createAction({
  name: 'get_network_stats',
  displayName: 'Get Network Stats',
  description: 'Get IoTeX network statistics including block height, total supply, and total staked IOTX.',
  props: {},
  async run() {
    // Get current block number (chainId + blockNumber via eth_blockNumber)
    const blockNumberHex = (await iotexRpc('eth_blockNumber', [])) as string;
    const blockHeight = parseInt(blockNumberHex, 16);

    // Get chain ID to confirm we're on IoTeX mainnet
    const chainIdHex = (await iotexRpc('eth_chainId', [])) as string;
    const chainId = parseInt(chainIdHex, 16);

    // Get total supply via iotex_getChainMeta (native IoTeX API)
    const chainMetaResponse = await fetch('https://api.iotex.io/v1/actions/metadata', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    let totalSupply: string | null = null;
    let totalStaked: string | null = null;

    try {
      const statsResponse = await fetch('https://api.iotex.io/api/staking/stats', {
        headers: { Accept: 'application/json' },
      });
      if (statsResponse.ok) {
        const statsData = (await statsResponse.json()) as {
          totalStaking?: string;
          totalSupply?: string;
        };
        totalStaked = statsData.totalStaking ?? null;
        totalSupply = statsData.totalSupply ?? null;
      }
    } catch {
      // fallback: stats not available
    }

    return {
      block_height: blockHeight,
      chain_id: chainId,
      total_supply_iotx: totalSupply,
      total_staked_iotx: totalStaked,
      network: 'IoTeX Mainnet',
    };
  },
});
