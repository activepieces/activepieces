import { createAction } from '@activepieces/pieces-framework';
import { httpPost } from '../common/filecoin-api';

const GLIF_RPC_URL = 'https://api.node.glif.io/rpc/v1';

async function rpcCall(method: string, params: unknown[] = []) {
  const body = {
    jsonrpc: '2.0',
    method,
    params,
    id: 1,
  };
  const response = (await httpPost(GLIF_RPC_URL, body)) as {
    result?: unknown;
    error?: { message: string };
  };
  if (response.error) {
    throw new Error(`RPC error: ${response.error.message}`);
  }
  return response.result;
}

export const getNetworkStats = createAction({
  name: 'getNetworkStats',
  displayName: 'Get Network Stats',
  description:
    'Get Filecoin network statistics including storage capacity, chain height, and network power.',
  props: {},
  async run() {
    const [chainHead, networkPower] = await Promise.all([
      rpcCall('Filecoin.ChainHead'),
      rpcCall('Filecoin.StateNetworkVersion', [[]]).catch(() => null),
    ]);

    const head = chainHead as {
      Height?: number;
      Blocks?: Array<{ Miner?: string }>;
    } | null;

    // Get network storage power
    const powerResult = (await rpcCall('Filecoin.StateMinerPower', [
      '',
      [],
    ]).catch(() => null)) as {
      TotalPower?: { RawBytePower?: string; QualityAdjPower?: string };
    } | null;

    const height = head?.Height ?? null;
    const rawBytePower = powerResult?.TotalPower?.RawBytePower ?? null;
    const qualityAdjPower = powerResult?.TotalPower?.QualityAdjPower ?? null;

    // Convert raw byte power from attoFIL string to TB
    const rawBytePowerTiB = rawBytePower
      ? (BigInt(rawBytePower) / BigInt(1024 ** 4)).toString()
      : null;

    return {
      chainHeight: height,
      networkVersion: networkPower,
      rawBytePower: rawBytePower,
      rawBytePowerTiB: rawBytePowerTiB
        ? `${rawBytePowerTiB} TiB`
        : null,
      qualityAdjPower: qualityAdjPower,
      dataSource: 'Glif Filecoin JSON-RPC API',
    };
  },
});
