import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.klipy.com';

type FileFormat = {
  url: string;
  width: number;
  height: number;
  size: number;
};

type SizeVariant = {
  gif?: FileFormat;
  webp?: FileFormat;
  jpg?: FileFormat;
  mp4?: FileFormat;
  webm?: FileFormat;
  png?: FileFormat;
};

type MediaFile = {
  hd?: SizeVariant;
  md?: SizeVariant;
  sm?: SizeVariant;
  xs?: SizeVariant;
};

type GifSticker = {
  id: number;
  slug: string;
  title: string;
  file: MediaFile;
  tags: string[];
  type: string;
  blur_preview: string;
};

type ClipFile = {
  mp4?: string;
  gif?: string;
  webp?: string;
};

type ClipFileMeta = {
  mp4?: { width: number; height: number };
  gif?: { width: number; height: number };
  webp?: { width: number; height: number };
};

type Clip = {
  url: string;
  title: string;
  slug: string;
  file: ClipFile;
  file_meta: ClipFileMeta;
  tags: string[];
  type: string;
  blur_preview: string;
};

type SearchResponse<T> = {
  result: boolean;
  data: {
    data: T[];
    current_page: number;
    per_page: number;
    has_next: boolean;
  };
};

type SearchParams = {
  appKey: string;
  endpoint: string;
  query: string | undefined;
  page: number;
  perPage: number;
  customerId: string | undefined;
  locale: string | undefined;
  contentFilter: string | undefined;
  formatFilter?: string | undefined;
};

async function search<T>({
  appKey,
  endpoint,
  query,
  page,
  perPage,
  customerId,
  locale,
  contentFilter,
  formatFilter,
}: SearchParams): Promise<SearchResponse<T>> {
  const queryParams: Record<string, string> = {
    page: String(page),
    per_page: String(perPage),
  };
  if (query) queryParams['q'] = query;
  if (customerId) queryParams['customer_id'] = customerId;
  if (locale) queryParams['locale'] = locale;
  if (contentFilter) queryParams['content_filter'] = contentFilter;
  if (formatFilter) queryParams['format_filter'] = formatFilter;

  const response = await httpClient.sendRequest<SearchResponse<T>>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/api/v1/${appKey}/${endpoint}`,
    queryParams,
  });
  return response.body;
}

function flattenGifSticker(item: GifSticker) {
  const hd = item.file?.hd;
  const sm = item.file?.sm;
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    type: item.type,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    hd_gif_url: hd?.gif?.url ?? null,
    hd_webp_url: hd?.webp?.url ?? null,
    hd_mp4_url: hd?.mp4?.url ?? null,
    hd_png_url: hd?.png?.url ?? null,
    hd_width: hd?.gif?.width ?? hd?.webp?.width ?? null,
    hd_height: hd?.gif?.height ?? hd?.webp?.height ?? null,
    sm_gif_url: sm?.gif?.url ?? null,
    sm_webp_url: sm?.webp?.url ?? null,
    sm_width: sm?.gif?.width ?? sm?.webp?.width ?? null,
    sm_height: sm?.gif?.height ?? sm?.webp?.height ?? null,
  };
}

function flattenClip(item: Clip) {
  return {
    title: item.title,
    slug: item.slug,
    url: item.url,
    type: item.type,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    mp4_url: item.file?.mp4 ?? null,
    gif_url: item.file?.gif ?? null,
    webp_url: item.file?.webp ?? null,
    mp4_width: item.file_meta?.mp4?.width ?? null,
    mp4_height: item.file_meta?.mp4?.height ?? null,
    gif_width: item.file_meta?.gif?.width ?? null,
    gif_height: item.file_meta?.gif?.height ?? null,
  };
}

export const klipyClient = { search, flattenGifSticker, flattenClip };
export type { GifSticker, Clip, SearchParams };
