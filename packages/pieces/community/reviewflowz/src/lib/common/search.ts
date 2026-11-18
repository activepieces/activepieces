import { HttpMethod } from '@activepieces/pieces-common';
import { reviewflowzApi, ReviewflowzAuthValue } from './client';
import { ReviewflowzPage } from './types';

async function list({
  auth,
  path,
  query,
}: {
  auth: ReviewflowzAuthValue;
  path: string;
  query: Record<string, string | number | undefined>;
}): Promise<Record<string, unknown>[]> {
  const page = await reviewflowzApi.call<ReviewflowzPage<Record<string, unknown>>>({ auth, method: HttpMethod.GET, path, query });
  return page.data ?? [];
}

function first(rows: Record<string, unknown>[]): Record<string, unknown> {
  const row = rows[0];
  return row ? { found: true, ...row } : { found: false };
}

function sameName({ row, name }: { row: Record<string, unknown>; name: string }): boolean {
  return String(row['name'] ?? '').toLowerCase() === name.trim().toLowerCase();
}

export const reviewflowzSearch = { list, first, sameName };
