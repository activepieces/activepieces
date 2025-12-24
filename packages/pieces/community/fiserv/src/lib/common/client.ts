import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { EFXHeader } from './types';

export async function callFiservApi<T = any>(
  method: HttpMethod,
  auth: any,
  endpoint: string,
  body?: any,
): Promise<{ body: T }> {
  const baseUrl = auth.baseUrl;
  const organizationId = auth.organizationId;
  const apiKey = auth.apiKey;

  // Generate unique transaction ID
  const transactionId = generateTransactionId();

  // Build EFXHeader (required by all Fiserv API calls)
  const efxHeader: EFXHeader = {
    OrgId: organizationId,
    TrnId: transactionId,
    // Add other required EFX fields based on swagger specs
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'EFXHeader': JSON.stringify(efxHeader),
  };

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl}${endpoint}`,
      headers,
      body,
    });

    return { body: response.body };
  } catch (error: any) {
    // Parse Fiserv error response and throw user-friendly error
    throw new Error(
      error.response?.body?.message ||
      error.message ||
      'Fiserv API request failed'
    );
  }
}

function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
