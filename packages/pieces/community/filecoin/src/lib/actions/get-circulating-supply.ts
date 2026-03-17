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

function attoFILtoFIL(attoFIL: string): string {
  const val = BigInt(attoFIL);
  const whole = val / BigInt(10 ** 18);
  const fraction = val % BigInt(10 ** 18);
  const fractionStr = fraction
    .toString()
    .padStart(18, '0')
    .slice(0, 4);
  return `${whole}.${fractionStr}`;
}

export const getCirculatingSupply = createAction({
  name: 'getCirculatingSupply',
  displayName: 'Get Circulating Supply',
  description:
    'Get FIL circulating supply, vested tokens, mined tokens, and total locked FIL from the Filecoin network.',
  props: {},
  async run() {
    const supplyResult = (await rpcCall(
      'Filecoin.StateVMCirculatingSupplyInternal',
      [[]]
    )) as Record<string, string> | null;

    if (!supplyResult) {
      // Fallback to simpler circulating supply call
      const simpleSupply = (await rpcCall(
        'Filecoin.StateCirculatingSupply',
        [[]]
      )) as string | null;

      return {
        circulatingSupply: simpleSupply
          ? attoFILtoFIL(simpleSupply) + ' FIL'
          : null,
        circulatingSupplyRaw: simpleSupply,
        dataSource: 'Glif Filecoin JSON-RPC API',
      };
    }

    return {
      filVested: supplyResult['FilVested']
        ? attoFILtoFIL(supplyResult['FilVested']) + ' FIL'
        : null,
      filMined: supplyResult['FilMined']
        ? attoFILtoFIL(supplyResult['FilMined']) + ' FIL'
        : null,
      filBurnt: supplyResult['FilBurnt']
        ? attoFILtoFIL(supplyResult['FilBurnt']) + ' FIL'
        : null,
      filLocked: supplyResult['FilLocked']
        ? attoFILtoFIL(supplyResult['FilLocked']) + ' FIL'
        : null,
      filCirculating: supplyResult['FilCirculating']
        ? attoFILtoFIL(supplyResult['FilCirculating']) + ' FIL'
        : null,
      filReserveDisbursed: supplyResult['FilReserveDisbursed']
        ? attoFILtoFIL(supplyResult['FilReserveDisbursed']) + ' FIL'
        : null,
      rawValues: supplyResult,
      dataSource: 'Glif Filecoin JSON-RPC API',
    };
  },
});
