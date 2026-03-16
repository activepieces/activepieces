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
  const queryParams = new URLSearchParams({
    chainid: '1',
    ...params,
    apikey: apiKey,
  });

  const response = await fetch(`${ETHERSCAN_API_BASE}?${queryParams}`);

  if (!response.ok) {
    throw new Error(
      `Etherscan API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as EtherscanResponse<T>;

  if (data.status === '0' || data.message === 'NOTOK') {
    const errorMessage =
      typeof data.result === 'string' ? data.result : data.message;
    throw new Error(`Etherscan API error: ${errorMessage}`);
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

export function gweiFromWei(wei: string): string {
  const weiBigInt = BigInt(wei);
  const gweiWhole = weiBigInt / BigInt('1000000000');
  const gweiFraction = weiBigInt % BigInt('1000000000');
  const fractionStr = gweiFraction.toString().padStart(9, '0').replace(/0+$/, '');
  return fractionStr ? `${gweiWhole}.${fractionStr}` : `${gweiWhole}`;
}
