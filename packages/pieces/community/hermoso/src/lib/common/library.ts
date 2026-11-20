import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { hermosoApi } from './client';

async function list({
  apiKey,
  brand,
  type,
  limit,
}: {
  apiKey: string;
  brand: string | undefined;
  type: string;
  limit: number | undefined;
}): Promise<LibraryItem[]> {
  const response = await hermosoApi.send<unknown>({
    apiKey,
    brand,
    method: HttpMethod.GET,
    path: '/library',
    queryParams: { type, limit: String(clampLimit(limit)) },
  });
  const data = hermosoApi.isRecord(response.body) ? response.body['data'] : undefined;
  const rows = Array.isArray(data) ? data.filter(hermosoApi.isRecord) : [];
  return rows
    .map((row) => ({
      url: hermosoApi.text(row['url']),
      type: hermosoApi.text(row['type']) || null,
      poster_url: hermosoApi.text(row['poster_url']) || null,
      model: hermosoApi.text(row['model']) || null,
      file_name: fileName(hermosoApi.text(row['url'])),
      created_at: hermosoApi.text(row['created_at']) || null,
    }))
    .filter((item) => item.url.startsWith('https://'));
}

function clampLimit(value: number | undefined): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(value)));
}

function fileName(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1] ?? '');
  } catch {
    return '';
  }
}

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

export const hermosoLibrary = {
  list,
  typeProp: Property.StaticDropdown({
    displayName: 'Kind',
    description: 'Which files to include.',
    required: false,
    defaultValue: 'all',
    options: {
      options: [
        { label: 'Images and videos', value: 'all' },
        { label: 'Images only', value: 'image' },
        { label: 'Videos only', value: 'video' },
      ],
    },
  }),
  maxLimit: MAX_LIMIT,
};

export type LibraryItem = {
  url: string;
  type: string | null;
  poster_url: string | null;
  model: string | null;
  file_name: string;
  created_at: string | null;
};
