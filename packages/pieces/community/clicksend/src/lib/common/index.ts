import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://rest.clicksend.com/v3';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  queryParams?: Record<string, any>,
  body?: unknown
) {
  try {
    console.log(apiKey)
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      queryParams,
      body,
    });

    return response.body;
  } catch (error: any) {
    // Handle ClickSend specific error codes
    if (error.response?.body?.data?.messages) {
      const messages = error.response.body.data.messages;
      const errorMessage = messages[0]?.message || 'Unknown ClickSend error';
      const errorCode = messages[0]?.result || 'UNKNOWN_ERROR';
      
      throw new Error(`ClickSend Error (${errorCode}): ${errorMessage}`);
    }

    // Handle HTTP status codes with ClickSend response codes
    if (error.response?.status === 400) {
      throw new Error('BAD_REQUEST: The request was invalid or cannot be otherwise served. Please check your request parameters.');
    }
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED: Authentication credentials were missing or incorrect. Please check your API credentials.');
    }
    if (error.response?.status === 403) {
      throw new Error('FORBIDDEN: The request is understood, but it has been refused or access is not allowed. Please check your API permissions.');
    }
    if (error.response?.status === 404) {
      throw new Error('NOT_FOUND: The URI requested is invalid or the resource requested does not exist.');
    }
    if (error.response?.status === 405) {
      throw new Error('METHOD_NOT_ALLOWED: Method doesn\'t exist or is not allowed for this endpoint.');
    }
    if (error.response?.status === 429) {
      throw new Error('TOO_MANY_REQUESTS: Rate Limit Exceeded. Please try again later.');
    }
    if (error.response?.status === 500) {
      throw new Error('INTERNAL_SERVER_ERROR: Something is broken on ClickSend\'s end. Please try again later.');
    }
    if (error.response?.status >= 500) {
      throw new Error('INTERNAL_SERVER_ERROR: ClickSend service error. Please try again later.');
    }

    // Generic error handling
    throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
  }
}

