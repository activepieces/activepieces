import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const READWISE_BASE_URL = 'https://readwise.io/api/v2';

export async function makeReadwiseRequest<T>(
  token: string,
  method: HttpMethod,
  endpoint: string,
  body?: object,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${READWISE_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const response = await httpClient.sendRequest<T>({
    method,
    url: url.toString(),
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export interface ReadwiseHighlight {
  id: number;
  text: string;
  note: string;
  location: number;
  location_type: string;
  color: string;
  highlighted_at: string | null;
  created_at: string;
  updated_at: string;
  external_id: string | null;
  end_location: number | null;
  url: string | null;
  book_id: number;
  tags: { id: number; name: string }[];
  is_favorite: boolean;
  is_discard: boolean;
}

export interface ReadwiseBook {
  id: number;
  title: string;
  author: string;
  category: string;
  source: string;
  num_highlights: number;
  last_highlight_at: string | null;
  updated: string;
  cover_image_url: string;
  highlights_url: string;
  source_url: string | null;
  asin: string | null;
  tags: { id: number; name: string }[];
  document_note: string;
}

export interface ReadwisePaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
