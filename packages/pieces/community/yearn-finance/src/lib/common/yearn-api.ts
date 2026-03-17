import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const YDAEMON_BASE_URL = 'https://ydaemon.yearn.fi';
export const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export const CHAIN_OPTIONS = {
  '1': 'Ethereum',
  '10': 'Optimism',
  '42161': 'Arbitrum',
  '250': 'Fantom',
};

export const yearnApi = {
  async getVaults(chainId: string, limit: number, skip: number) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${YDAEMON_BASE_URL}/vaults`,
      queryParams: {
        limit: String(limit),
        skip: String(skip),
        chainIDs: chainId,
      },
    });
    return response.body;
  },

  async getVaultDetail(chainId: string, vaultAddress: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${YDAEMON_BASE_URL}/vaults/${chainId}/${vaultAddress}`,
    });
    return response.body;
  },

  async getProtocolStats() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE_URL}/protocol/yearn-finance`,
    });
    return response.body;
  },

  async getYfiTokenStats() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE_URL}/coins/yearn-finance`,
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
      },
    });
    return response.body;
  },

  async getStrategies(chainId: string, vaultAddress: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${YDAEMON_BASE_URL}/vaults/${chainId}/${vaultAddress}/strategies`,
    });
    return response.body;
  },
};
