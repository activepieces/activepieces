import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const WSTETH_CONTRACT = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0';
const ETH_MAINNET_RPC = 'https://ethereum.publicnode.com';

// tokensPerStEth() selector = 0x9576a0c8
const TOKENS_PER_STETH_SELECTOR = '0x9576a0c8';
// stEthPerToken() selector = 0x035faf82
const STETH_PER_TOKEN_SELECTOR = '0x035faf82';

async function ethCall(to: string, data: string): Promise<string> {
  const response = await httpClient.sendRequest<{ result: string }>({
    method: HttpMethod.POST,
    url: ETH_MAINNET_RPC,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
  });
  return response.body.result;
}

function hexToDecimal(hex: string): bigint {
  return BigInt(hex);
}

function formatUnits(value: bigint, decimals = 18): string {
  const divisor = BigInt(10 ** decimals);
  const intPart = value / divisor;
  const fracPart = value % divisor;
  const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 6);
  return `${intPart}.${fracStr}`;
}

export const getWstethRate = createAction({
  name: 'get_wsteth_rate',
  displayName: 'Get wstETH / stETH Rate',
  description: 'Fetch the current wstETH to stETH exchange rate by calling the wstETH contract on Ethereum mainnet.',
  props: {},
  async run() {
    const [tokensPerStEthHex, stEthPerTokenHex] = await Promise.all([
      ethCall(WSTETH_CONTRACT, TOKENS_PER_STETH_SELECTOR),
      ethCall(WSTETH_CONTRACT, STETH_PER_TOKEN_SELECTOR),
    ]);

    const tokensPerStEth = hexToDecimal(tokensPerStEthHex);
    const stEthPerToken = hexToDecimal(stEthPerTokenHex);

    return {
      wstETHPerStETH: formatUnits(tokensPerStEth),
      stETHPerWstETH: formatUnits(stEthPerToken),
      wstETHContract: WSTETH_CONTRACT,
      network: 'mainnet',
      note: 'stETHPerWstETH shows how much stETH 1 wstETH is worth (increases over time as staking rewards accrue).',
    };
  },
});
