import { HttpMethod } from '@activepieces/pieces-common';

export const GLASSNODE_BASE_URL = 'https://api.glassnode.com/v1/metrics';

export interface GlassnodeMetricParams {
  asset: string;
  interval: string;
  since?: number;
  until?: number;
}

export interface GlassnodeDataPoint {
  t: number;
  v: number | null;
}

export async function fetchGlassnodeMetric(
  apiKey: string,
  endpoint: string,
  params: GlassnodeMetricParams
): Promise<GlassnodeDataPoint[]> {
  const url = new URL(`${GLASSNODE_BASE_URL}/${endpoint}`);
  url.searchParams.set('a', params.asset);
  url.searchParams.set('i', params.interval);
  url.searchParams.set('api_key', apiKey);
  if (params.since !== undefined) url.searchParams.set('s', String(params.since));
  if (params.until !== undefined) url.searchParams.set('u', String(params.until));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Glassnode API error (${response.status}): ${error}`);
  }
  return response.json() as Promise<GlassnodeDataPoint[]>;
}
