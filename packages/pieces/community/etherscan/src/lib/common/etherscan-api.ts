import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api';

export interface EtherscanResponse<T = string> {
  status: string;
  message: string;
  result: T;
}

export async function etherscanRequest<T = string>(
  apiKey: string,
  params: Record<string, string>
): Promise<EtherscanResponse<T>> {
  const queryParams: Record<string, string> = {
    chainid: '1',
    ...params,
    apikey: apiKey,
  };

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: ETHERSCAN_API_BASE,
    queryParams,
  });

  const data = response.body as EtherscanResponse<T>;

  if (data.status === '0' && data.message === 'NOTOK') {
    const errorMessage =
      typeof data.result === 'string' ? data.result : data.message;
    throw new Error(`Etherscan API error: ${errorMessage}`);
  }

  // Handle empty results (status='0' with 'No transactions found' etc.) as valid empty arrays
  if (data.status === '0' && typeof data.message === 'string' && data.message.toLowerCase().includes('no ')) {
    return {
      ...data,
      result: [] as unknown as T,
    };
  }

  return data;
}

export function weiToEth(wei: string): string {
  const weiBigInt = BigInt(wei);
  const ethWhole = weiBigInt / BigInt('1000000000000000000');
  const ethFraction = weiBigInt % BigInt('1000000000000000000');
  const fractionStr = ethFraction.toString().padStart(18, '0').replace(/0+$/, '');
  return fractionStr ? `${ethWhole}.${fractionStr}` : `${ethWhole}`;
}
