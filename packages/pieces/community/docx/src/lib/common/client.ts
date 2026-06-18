import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

// Base de l'API DocX (identique au connecteur Zapier).
export const DOCX_API_BASE = 'https://docx.layerone.fr';

// Type MIME d'un document Word (.docx).
export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Sérialise un objet en chaîne application/x-www-form-urlencoded.
 * Le httpClient d'Activepieces sérialise par défaut en JSON ; pour reproduire
 * le comportement Zapier (render-* en form-urlencoded), on sérialise nous-mêmes
 * et on force l'en-tête Content-Type.
 */
export function toFormEncoded(body: Record<string, unknown>): string {
  return Object.entries(body)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * Construit les en-têtes communs : la clé API DocX va dans X-API-Key
 * UNIQUEMENT sur les appels vers docx.layerone.fr (jamais vers une URL externe).
 */
export function docxHeaders(
  apiKey: string,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    'X-API-Key': apiKey,
    ...(extra ?? {}),
  };
}

/**
 * Appel JSON/standard vers l'API DocX. Renvoie le corps de la réponse.
 */
export async function docxRequest<T = unknown>(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<T> {
  const { apiKey, method, path, body, headers } = params;
  const request: HttpRequest = {
    method,
    url: `${DOCX_API_BASE}${path}`,
    headers: docxHeaders(apiKey, headers),
    body,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

/**
 * Appel render-* en form-urlencoded qui renvoie un fichier binaire (PDF/DOCX).
 * Renvoie le Buffer du fichier généré.
 */
export async function docxRenderToBuffer(params: {
  apiKey: string;
  path: string;
  formBody: Record<string, unknown>;
}): Promise<Buffer> {
  const { apiKey, path, formBody } = params;
  const request: HttpRequest<string> = {
    method: HttpMethod.POST,
    url: `${DOCX_API_BASE}${path}`,
    headers: docxHeaders(apiKey, {
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: toFormEncoded(formBody),
    responseType: 'arraybuffer',
  };
  const response = await httpClient.sendRequest<ArrayBuffer>(request);
  return Buffer.from(response.body);
}

/**
 * Téléchargement binaire (GET) qui renvoie un fichier (Buffer).
 */
export async function docxDownloadToBuffer(params: {
  apiKey: string;
  path: string;
}): Promise<Buffer> {
  const { apiKey, path } = params;
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${DOCX_API_BASE}${path}`,
    headers: docxHeaders(apiKey),
    responseType: 'arraybuffer',
  };
  const response = await httpClient.sendRequest<ArrayBuffer>(request);
  return Buffer.from(response.body);
}
