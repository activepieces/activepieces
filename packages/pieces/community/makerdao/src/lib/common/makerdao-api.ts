import { HttpMethod } from '@activepieces/pieces-common';

export const MAKERBURN_BASE = 'https://api.makerburn.com';
export const THEGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/protofire/maker-protocol';

export interface ProtocolStats {
  dai_supply: number;
  total_debt: number;
  surplus_buffer: number;
  system_surplus: number;
  dai_savings_rate: number;
  timestamp?: string;
}

export interface RateEntry {
  ilk: string;
  stability_fee: number;
  duty: number;
}

export interface RatesResponse {
  dsr: number;
  rates: RateEntry[];
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MakerDAO API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCurrentStats(): Promise<ProtocolStats> {
  return fetchJson<ProtocolStats>(`${MAKERBURN_BASE}/current`);
}

export async function fetchRates(): Promise<RatesResponse> {
  return fetchJson<RatesResponse>(`${MAKERBURN_BASE}/rates`);
}

export async function fetchTheGraphQuery(query: string): Promise<unknown> {
  const response = await fetch(THEGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`TheGraph API error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const COLLATERAL_TYPES = [
  { ilk: 'ETH-A', name: 'ETH-A', token: 'ETH', liquidationRatio: 150, stabilityFee: 0.5 },
  { ilk: 'ETH-B', name: 'ETH-B', token: 'ETH', liquidationRatio: 130, stabilityFee: 3.0 },
  { ilk: 'ETH-C', name: 'ETH-C', token: 'ETH', liquidationRatio: 175, stabilityFee: 0.25 },
  { ilk: 'WBTC-A', name: 'WBTC-A', token: 'WBTC', liquidationRatio: 150, stabilityFee: 0.75 },
  { ilk: 'WBTC-B', name: 'WBTC-B', token: 'WBTC', liquidationRatio: 130, stabilityFee: 3.0 },
  { ilk: 'WBTC-C', name: 'WBTC-C', token: 'WBTC', liquidationRatio: 175, stabilityFee: 0.5 },
  { ilk: 'USDC-A', name: 'USDC-A', token: 'USDC', liquidationRatio: 101, stabilityFee: 0 },
  { ilk: 'USDP-A', name: 'USDP-A', token: 'USDP', liquidationRatio: 101, stabilityFee: 0 },
  { ilk: 'GUSD-A', name: 'GUSD-A', token: 'GUSD', liquidationRatio: 101, stabilityFee: 0 },
  { ilk: 'WSTETH-A', name: 'WSTETH-A', token: 'wstETH', liquidationRatio: 150, stabilityFee: 0.25 },
  { ilk: 'WSTETH-B', name: 'WSTETH-B', token: 'wstETH', liquidationRatio: 175, stabilityFee: 0.1 },
  { ilk: 'RETH-A', name: 'RETH-A', token: 'rETH', liquidationRatio: 150, stabilityFee: 0.5 },
  { ilk: 'CRVV1ETHSTETH-A', name: 'CRVV1ETHSTETH-A', token: 'CRV', liquidationRatio: 155, stabilityFee: 1.0 },
  { ilk: 'UNIV2DAIETH-A', name: 'UNIV2DAIETH-A', token: 'UNI-V2', liquidationRatio: 125, stabilityFee: 1.0 },
  { ilk: 'PSM-USDC-A', name: 'PSM-USDC-A (Peg Stability Module)', token: 'USDC', liquidationRatio: 100, stabilityFee: 0 },
  { ilk: 'PSM-GUSD-A', name: 'PSM-GUSD-A (Peg Stability Module)', token: 'GUSD', liquidationRatio: 100, stabilityFee: 0 },
  { ilk: 'PSM-USDP-A', name: 'PSM-USDP-A (Peg Stability Module)', token: 'USDP', liquidationRatio: 100, stabilityFee: 0 },
  { ilk: 'RWA001-A', name: 'RWA001-A (Real World Asset)', token: 'RWA001', liquidationRatio: 100, stabilityFee: 3.0 },
  { ilk: 'RWA002-A', name: 'RWA002-A (Real World Asset)', token: 'RWA002', liquidationRatio: 105, stabilityFee: 3.5 },
  { ilk: 'MATIC-A', name: 'MATIC-A', token: 'MATIC', liquidationRatio: 175, stabilityFee: 0.5 },
  { ilk: 'LINK-A', name: 'LINK-A', token: 'LINK', liquidationRatio: 165, stabilityFee: 0.75 },
  { ilk: 'YFI-A', name: 'YFI-A', token: 'YFI', liquidationRatio: 165, stabilityFee: 1.5 },
  { ilk: 'MANA-A', name: 'MANA-A', token: 'MANA', liquidationRatio: 175, stabilityFee: 3.0 },
  { ilk: 'RENBTC-A', name: 'RENBTC-A', token: 'renBTC', liquidationRatio: 150, stabilityFee: 2.0 },
  { ilk: 'COMP-A', name: 'COMP-A', token: 'COMP', liquidationRatio: 150, stabilityFee: 1.0 },
  { ilk: 'BAL-A', name: 'BAL-A', token: 'BAL', liquidationRatio: 165, stabilityFee: 1.0 },
  { ilk: 'AAVE-A', name: 'AAVE-A', token: 'AAVE', liquidationRatio: 165, stabilityFee: 0.5 },
];
