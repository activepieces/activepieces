import {
  HttpRequest,
  HttpMethod,
  httpClient,
  HttpError,
} from '@activepieces/pieces-common';
import crypto from 'crypto';

export const BASE_URL = 'https://api.helpscout.net/v2';


function getErrorMessage(error: any): string {
  if (error?.response?.body?.message) return error.response.body.message;
  if (error?.response?.body?.error) return error.response.body.error;
  if (error?.message) return error.message;
  return 'Unknown error occurred';
}

export async function helpScoutApiRequest(params: {
  method: HttpMethod;
  url: string;
  auth: any;
  body?: any;
  queryParams?: Record<string, any>;
}) {
  try {
    const request: HttpRequest = {
      method: params.method,
      url: `${BASE_URL}${params.url}`,
      headers: {
        Authorization: `Bearer ${params.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: params.body,
      queryParams: params.queryParams,
    };
    const response = await httpClient.sendRequest(request);
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      const errorMsg = getErrorMessage(response.body);
      throw new Error(`Help Scout API Error (${response.status}): ${errorMsg}`);
    }
  } catch (error: any) {
    console.error('Help Scout API Error:', error);
    throw new Error(getErrorMessage(error));
  }
}

export function verifyWebhookSignature(
	webhookSecret?: string,
	webhookSignatureHeader?: string,
	webhookRawBody?: any,
): boolean {
	if (!webhookSecret || !webhookSignatureHeader || !webhookRawBody) {
		return false;
	}

	try {
		const hmac = crypto.createHmac('sha1', webhookSecret);
		hmac.update(webhookRawBody);
		const expectedSignature = hmac.digest('base64');

		return crypto.timingSafeEqual(
			Buffer.from(webhookSignatureHeader, 'hex'),
			Buffer.from(expectedSignature, 'hex'),
		);
	} catch (error) {
		return false;
	}
}