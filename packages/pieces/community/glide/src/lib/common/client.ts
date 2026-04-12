import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

import {
  GlideAddRowsResponse,
  GlideGetRowsResponse,
  GlideListTablesResponse,
  GlideRow,
  GlideTable,
} from './types';
import { GlideAuthType } from '../auth';

async function sendRequest<TResponse>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: GlideAuthType;
  method: HttpMethod;
  path: string;
  body?: GlideRow | GlideRow[];
  queryParams?: Record<string, string>;
}): Promise<TResponse> {
  const response = await httpClient.sendRequest<TResponse>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${auth.secret_text}`,
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body } : {}),
    ...(queryParams ? { queryParams } : {}),
  });

  return response.body;
}

export async function validateGlideAuth(auth: string): Promise<void> {
  await listGlideTables({
    type: AppConnectionType.SECRET_TEXT,
    secret_text: auth,
  });
}

export async function listGlideTables(auth: GlideAuthType): Promise<GlideTable[]> {
  const response = await sendRequest<GlideListTablesResponse>({
    auth,
    method: HttpMethod.GET,
    path: '/tables',
  });

  return response.data;
}

export async function getGlideRows({
  auth,
  tableId,
  limit,
}: {
  auth: GlideAuthType;
  tableId: string;
  limit: number;
}): Promise<GlideRow[]> {
  const rows: GlideRow[] = [];
  let continuation: string | undefined;

  while (rows.length < limit) {
    const remaining = limit - rows.length;
    const response = await sendRequest<GlideGetRowsResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/tables/${encodeURIComponent(tableId)}/rows`,
      queryParams: {
        limit: String(remaining),
        ...(continuation ? { continuation } : {}),
      },
    });

    rows.push(...response.data);

    if (!response.continuation || response.data.length === 0) {
      break;
    }

    continuation = response.continuation;
  }

  return rows;
}

export async function addGlideRows({
  auth,
  tableId,
  rows,
}: {
  auth: GlideAuthType;
  tableId: string;
  rows: GlideRow[];
}): Promise<GlideAddRowsResponse['data']> {
  const response = await sendRequest<GlideAddRowsResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/tables/${encodeURIComponent(tableId)}/rows`,
    body: rows,
  });

  return response.data;
}

export async function updateGlideRow({
  auth,
  tableId,
  rowId,
  row,
}: {
  auth: GlideAuthType;
  tableId: string;
  rowId: string;
  row: GlideRow;
}): Promise<void> {
  await sendRequest<Record<string, never>>({
    auth,
    method: HttpMethod.PATCH,
    path: `/tables/${encodeURIComponent(tableId)}/rows/${encodeURIComponent(rowId)}`,
    body: row,
  });
}

export async function deleteGlideRow({
  auth,
  tableId,
  rowId,
}: {
  auth: GlideAuthType;
  tableId: string;
  rowId: string;
}): Promise<void> {
  await sendRequest<Record<string, never>>({
    auth,
    method: HttpMethod.DELETE,
    path: `/tables/${encodeURIComponent(tableId)}/rows/${encodeURIComponent(rowId)}`,
  });
}



export const BASE_URL = 'https://api.glideapps.com';
