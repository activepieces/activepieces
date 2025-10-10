import { ServiceNowAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';

export interface ServiceNowApiResponse<T = any> {
  result: T;
}

export interface ServiceNowRecord {
  sys_id: string;
  [key: string]: any;
}

export async function callServiceNowApi<T = any>(
  method: HttpMethod,
  auth: ServiceNowAuth,
  endpoint: string,
  body?: any,
  queryParams?: Record<string, string>
): Promise<T> {
  const url = new URL(`${auth.instanceUrl}/api/now${endpoint}`);
  
  // Add query parameters
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers: Record<string, string> = {
    'Authorization': `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (body && (method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH)) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ServiceNow API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

export async function getServiceNowTables(auth: ServiceNowAuth): Promise<string[]> {
  try {
    const response = await callServiceNowApi<ServiceNowApiResponse<Array<{ name: string; label: string }>>>(
      HttpMethod.GET,
      auth,
      '/sys_db_object',
      undefined,
      { sysparm_fields: 'name,label', sysparm_limit: '1000' }
    );
    
    return response.result.map(table => table.name);
  } catch (error) {
    // Fallback to common tables if we can't fetch all tables
    return [
      'incident',
      'change_request',
      'problem',
      'sc_request',
      'sc_task',
      'sys_user',
      'cmdb_ci',
      'kb_knowledge',
      'sys_attachment',
    ];
  }
}

export function formatServiceNowDate(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}
