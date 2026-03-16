export const COINMETRICS_BASE_URL = 'https://community-api.coinmetrics.io/v4';

export interface AssetMetricsParams {
  assets: string;
  metrics: string;
  start_time?: string;
  end_time?: string;
  frequency?: string;
  limit_per_asset?: number;
}

export interface PairMetricsParams {
  pairs: string;
  metrics: string;
  start_time?: string;
  end_time?: string;
  frequency?: string;
}

export interface ExchangeMetricsParams {
  exchanges: string;
  metrics: string;
  start_time?: string;
  end_time?: string;
  frequency?: string;
}

export async function fetchAssetMetrics(
  params: AssetMetricsParams
): Promise<Record<string, unknown>> {
  const url = new URL(`${COINMETRICS_BASE_URL}/timeseries/asset-metrics`);
  url.searchParams.set('assets', params.assets);
  url.searchParams.set('metrics', params.metrics);
  if (params.start_time) url.searchParams.set('start_time', params.start_time);
  if (params.end_time) url.searchParams.set('end_time', params.end_time);
  if (params.frequency) url.searchParams.set('frequency', params.frequency);
  if (params.limit_per_asset) url.searchParams.set('limit_per_asset', String(params.limit_per_asset));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CoinMetrics API error (${response.status}): ${error}`);
  }
  return response.json();
}

export async function fetchAssetCatalog(): Promise<Record<string, unknown>> {
  const url = `${COINMETRICS_BASE_URL}/catalog/assets`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CoinMetrics API error (${response.status}): ${error}`);
  }
  return response.json();
}

export async function fetchMetricsCatalog(): Promise<Record<string, unknown>> {
  const url = `${COINMETRICS_BASE_URL}/catalog/metrics`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CoinMetrics API error (${response.status}): ${error}`);
  }
  return response.json();
}

export async function fetchPairMetrics(
  params: PairMetricsParams
): Promise<Record<string, unknown>> {
  const url = new URL(`${COINMETRICS_BASE_URL}/timeseries/pair-metrics`);
  url.searchParams.set('pairs', params.pairs);
  url.searchParams.set('metrics', params.metrics);
  if (params.start_time) url.searchParams.set('start_time', params.start_time);
  if (params.end_time) url.searchParams.set('end_time', params.end_time);
  if (params.frequency) url.searchParams.set('frequency', params.frequency);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CoinMetrics API error (${response.status}): ${error}`);
  }
  return response.json();
}

export async function fetchExchangeMetrics(
  params: ExchangeMetricsParams
): Promise<Record<string, unknown>> {
  const url = new URL(`${COINMETRICS_BASE_URL}/timeseries/exchange-metrics`);
  url.searchParams.set('exchanges', params.exchanges);
  url.searchParams.set('metrics', params.metrics);
  if (params.start_time) url.searchParams.set('start_time', params.start_time);
  if (params.end_time) url.searchParams.set('end_time', params.end_time);
  if (params.frequency) url.searchParams.set('frequency', params.frequency);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CoinMetrics API error (${response.status}): ${error}`);
  }
  return response.json();
}
