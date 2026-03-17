import { createAction } from '@activepieces/pieces-framework';

export const getNetworkInfo = createAction({
  name: 'getNetworkInfo',
  displayName: 'Get Network Info',
  description: 'Fetch current Arweave network information including block height, node version, and peers.',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://arweave.net/info');

    if (!response.ok) {
      throw new Error(`Arweave API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      network: string;
      version: number;
      release: number;
      height: number;
      current: string;
      blocks: number;
      peers: number;
      queue_length: number;
      node_state_latency: number;
    };

    return {
      network: data.network,
      version: data.version,
      release: data.release,
      height: data.height,
      current_block: data.current,
      total_blocks: data.blocks,
      peers: data.peers,
      queue_length: data.queue_length,
      node_state_latency: data.node_state_latency,
    };
  },
});
