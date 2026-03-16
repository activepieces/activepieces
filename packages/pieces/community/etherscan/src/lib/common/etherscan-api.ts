const ETHERSCAN_API_BASE = 'https://api.etherscan.io/api';

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

  if (data.status === '0' && data.message === 'NOTOK') {
    throw new Error(`Etherscan API error: ${data.result}`);
  }

  return data;
}

export function weiToEth(wei: string): string {
  const weiBigInt = BigInt(wei);
  const ethWhole = weiBigInt / BigInt(1e18);
  const ethFraction = weiBigInt % BigInt(1e18);
  const fractionStr = ethFraction.toString().padStart(18, '0').replace(/0+$/, '');
  return fractionStr ? `${ethWhole}.${fractionStr}` : `${ethWhole}`;
}

export function gweiFromWei(wei: string): string {
  const weiBigInt = BigInt(wei);
  const gweiWhole = weiBigInt / BigInt(1e9);
  const gweiFraction = weiBigInt % BigInt(1e9);
  const fractionStr = gweiFraction.toString().padStart(9, '0').replace(/0+$/, '');
  return fractionStr ? `${gweiWhole}.${fractionStr}` : `${gweiWhole}`;
}
