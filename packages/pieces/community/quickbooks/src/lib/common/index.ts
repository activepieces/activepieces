import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const QB_BASE_URL_PRODUCTION = 'https://quickbooks.api.intuit.com/v3';
export const QB_BASE_URL_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3';

/**
 * Returns the appropriate base URL depending on sandbox mode.
 */
export function getBaseUrl(useSandbox = false): string {
  return useSandbox ? QB_BASE_URL_SANDBOX : QB_BASE_URL_PRODUCTION;
}

/**
 * Build common QuickBooks API request headers.
 */
export function qbHeaders(auth: OAuth2PropertyValue): Record<string, string> {
  return {
    Authorization: `Bearer ${auth.access_token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * Run a QuickBooks query (SQL-like) against the given entity.
 * 
 * @param auth - OAuth2 connection
 * @param realmId - The QuickBooks Company ID (realmId)
 * @param query - A QuickBooks query string, e.g. "SELECT * FROM Customer"
 * @param useSandbox - Whether to use sandbox environment
 */
export async function runQBQuery<T>(
  auth: OAuth2PropertyValue,
  realmId: string,
  query: string,
  useSandbox = false
): Promise<T[]> {
  const base = getBaseUrl(useSandbox);
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${base}/company/${realmId}/query`,
    headers: qbHeaders(auth),
    queryParams: { query, minorversion: '65' },
  };
  const response = await httpClient.sendRequest<{
    QueryResponse: Record<string, T[]>;
  }>(request);

  if (response.status !== 200) {
    throw new Error(`QuickBooks query failed: ${JSON.stringify(response.body)}`);
  }

  const qr = response.body?.QueryResponse ?? {};
  // The key is the entity type (Customer, Invoice, Payment, etc.)
  const keys = Object.keys(qr).filter((k) => k !== 'startPosition' && k !== 'maxResults' && k !== 'totalCount');
  if (keys.length === 0) return [];
  return (qr[keys[0]] as T[]) ?? [];
}

/**
 * Get a single QuickBooks entity by ID.
 */
export async function getQBEntity<T>(
  auth: OAuth2PropertyValue,
  realmId: string,
  entityType: string,
  entityId: string,
  useSandbox = false
): Promise<T> {
  const base = getBaseUrl(useSandbox);
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${base}/company/${realmId}/${entityType.toLowerCase()}/${entityId}`,
    headers: qbHeaders(auth),
    queryParams: { minorversion: '65' },
  };
  const response = await httpClient.sendRequest<Record<string, T>>(request);

  if (response.status !== 200) {
    throw new Error(`QuickBooks GET ${entityType} failed: ${JSON.stringify(response.body)}`);
  }

  return response.body[entityType] as T;
}

/**
 * Create or update a QuickBooks entity.
 */
export async function createQBEntity<T>(
  auth: OAuth2PropertyValue,
  realmId: string,
  entityType: string,
  body: Record<string, unknown>,
  useSandbox = false
): Promise<T> {
  const base = getBaseUrl(useSandbox);
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${base}/company/${realmId}/${entityType.toLowerCase()}`,
    headers: qbHeaders(auth),
    body,
    queryParams: { minorversion: '65' },
  };
  const response = await httpClient.sendRequest<Record<string, T>>(request);

  if (response.status !== 200) {
    throw new Error(`QuickBooks create ${entityType} failed: ${JSON.stringify(response.body)}`);
  }

  return response.body[entityType] as T;
}

/**
 * QuickBooks Customer type (partial - most commonly used fields)
 */
export interface QBCustomer {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: QBAddress;
  ShipAddr?: QBAddress;
  Active?: boolean;
  Balance?: number;
  MetaData?: { CreateTime: string; LastUpdatedTime: string };
  SyncToken?: string;
}

/**
 * QuickBooks Invoice type (partial)
 */
export interface QBInvoice {
  Id: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  CustomerRef: { value: string; name?: string };
  Line: QBLineItem[];
  TotalAmt?: number;
  Balance?: number;
  EmailStatus?: string;
  PrintStatus?: string;
  BillEmail?: { Address: string };
  CustomerMemo?: { value: string };
  PrivateNote?: string;
  MetaData?: { CreateTime: string; LastUpdatedTime: string };
  SyncToken?: string;
}

/**
 * QuickBooks Payment type (partial)
 */
export interface QBPayment {
  Id: string;
  TxnDate?: string;
  CustomerRef: { value: string; name?: string };
  TotalAmt: number;
  PaymentRefNum?: string;
  DepositToAccountRef?: { value: string; name?: string };
  Line?: QBPaymentLine[];
  MetaData?: { CreateTime: string; LastUpdatedTime: string };
  SyncToken?: string;
}

export interface QBLineItem {
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail' | 'DescriptionOnly';
  Description?: string;
  SalesItemLineDetail?: {
    ItemRef?: { value: string; name?: string };
    Qty?: number;
    UnitPrice?: number;
  };
}

export interface QBPaymentLine {
  Amount: number;
  LinkedTxn: { TxnId: string; TxnType: 'Invoice' }[];
}

export interface QBAddress {
  Line1?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  Country?: string;
}
