import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const CRYPTOPANIC_BASE_URL = 'https://cryptopanic.com/api/v1';

export interface CryptoPanicPost {
  id: number;
  title: string;
  published_at: string;
  url: string;
  domain: string;
  currencies?: Array<{ code: string; title: string; slug: string; url: string }>;
  votes?: {
    negative: number;
    positive: number;
    important: number;
    liked: number;
    disliked: number;
    lol: number;
    toxic: number;
    saved: number;
    comments: number;
  };
  kind: string;
  source?: { title: string; region: string; domain: string };
}

export interface CryptoPanicResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: CryptoPanicPost[];
}

export interface FetchPostsParams {
  apiKey?: string | null;
  public?: boolean;
  kind?: string;
  filter?: string;
  currencies?: string;
  regions?: string;
}

export async function fetchCryptoPanicPosts(params: FetchPostsParams): Promise<CryptoPanicResponse> {
  const queryParams = new URLSearchParams();

  if (params.apiKey && params.apiKey.trim()) {
    queryParams.set('auth_token', params.apiKey.trim());
  }

  queryParams.set('public', 'true');

  if (params.kind && params.kind.trim() && params.kind.trim() !== 'all') {
    queryParams.set('kind', params.kind.trim());
  }

  if (params.filter && params.filter.trim()) {
    queryParams.set('filter', params.filter.trim());
  }

  if (params.currencies && params.currencies.trim()) {
    queryParams.set('currencies', params.currencies.trim().toUpperCase());
  }

  if (params.regions && params.regions.trim()) {
    queryParams.set('regions', params.regions.trim());
  }

  const url = `${CRYPTOPANIC_BASE_URL}/posts/?${queryParams.toString()}`;

  const response = await httpClient.sendRequest<CryptoPanicResponse>({
    method: HttpMethod.GET,
    url,
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = response.body;

  return {
    count: data?.count ?? 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: data?.results ?? [],
  };
}
