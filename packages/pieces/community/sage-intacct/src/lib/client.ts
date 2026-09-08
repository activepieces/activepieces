import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.intacct.com/ia/api/v1';

async function apiCall<T>({
  accessToken,
  method,
  path,
  body,
}: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

async function query<T extends Record<string, unknown>>({
  accessToken,
  object,
  fields,
  filters,
  filterExpression,
  orderBy,
  start,
  size,
}: {
  accessToken: string;
  object: string;
  fields: string[];
  filters?: IntacctFilter[];
  filterExpression?: string;
  orderBy?: Record<string, 'asc' | 'desc'>[];
  start?: number;
  size?: number;
}): Promise<{ records: T[]; totalCount: number }> {
  const response = await apiCall<{
    'ia::result': T[];
    'ia::meta': { totalCount: number };
  }>({
    accessToken,
    method: HttpMethod.POST,
    path: '/services/core/query',
    body: {
      object,
      fields,
      ...(filters ? { filters } : {}),
      ...(filterExpression ? { filterExpression } : {}),
      ...(orderBy ? { orderBy } : {}),
      ...(start !== undefined ? { start } : {}),
      ...(size !== undefined ? { size } : {}),
    },
  });
  return {
    records: response['ia::result'],
    totalCount: response['ia::meta'].totalCount,
  };
}

async function queryAll<T extends Record<string, unknown>>({
  accessToken,
  object,
  fields,
  filters,
  filterExpression,
  orderBy,
}: {
  accessToken: string;
  object: string;
  fields: string[];
  filters?: IntacctFilter[];
  filterExpression?: string;
  orderBy?: Record<string, 'asc' | 'desc'>[];
}): Promise<T[]> {
  const pageSize = 100;
  const maxPages = 10;
  const records: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const { records: pageRecords } = await query<T>({
      accessToken,
      object,
      fields,
      filters,
      filterExpression,
      orderBy,
      start: page * pageSize,
      size: pageSize,
    });
    records.push(...pageRecords);
    if (pageRecords.length < pageSize) break;
  }
  return records;
}

function toDate(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function documentPath({
  module,
  documentName,
  key,
}: {
  module: string;
  documentName: string;
  key?: string;
}): string {
  const base = `/objects/${module}/document::${encodeURIComponent(documentName)}`;
  return key ? `${base}/${key}` : base;
}

export const sageIntacctClient = {
  apiCall,
  query,
  queryAll,
  toDate,
  documentPath,
  objects: {
    contact: 'company-config/contact',
    customer: 'accounts-receivable/customer',
    vendor: 'accounts-payable/vendor',
    bill: 'accounts-payable/bill',
    arInvoice: 'accounts-receivable/invoice',
    arPayment: 'accounts-receivable/payment',
    orderEntryDocument: 'order-entry/document',
    purchasingDocument: 'purchasing/document',
    projectResource: 'projects/project-resource',
    project: 'projects/project',
    employee: 'company-config/employee',
    item: 'inventory-control/item',
  },
};

type IntacctFilterOperator = '$eq' | '$gt' | '$gte' | '$lte' | '$between' | '$contains';

type IntacctFilterValue = string | number | boolean | (string | number)[];

export type IntacctFilter = Partial<
  Record<IntacctFilterOperator, Record<string, IntacctFilterValue>>
>;

export type IntacctObjectReference = {
  key: string;
  id: string;
  href: string;
};
