import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

// Base de l'API Sign (identique au connecteur Zapier).
export const SIGN_API_BASE = 'https://sign.layerone.fr';

/**
 * Construit les en-têtes communs : la clé API Sign va dans X-API-Key
 * UNIQUEMENT sur les appels vers sign.layerone.fr (jamais vers une URL externe).
 */
export function signHeaders(
  apiKey: string,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    'X-API-Key': apiKey,
    ...(extra ?? {}),
  };
}

/**
 * Appel JSON/standard vers l'API Sign. Renvoie le corps de la réponse.
 */
export async function signRequest<T = unknown>(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}): Promise<T> {
  const { apiKey, method, path, body } = params;
  const request: HttpRequest = {
    method,
    url: `${SIGN_API_BASE}${path}`,
    headers: signHeaders(
      apiKey,
      body ? { 'Content-Type': 'application/json' } : undefined,
    ),
    body,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
