import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function makeRequest(
  access_token: string,
  method: HttpMethod,
  path: string,
  location?: string,
  body?: unknown
) {
  try {
    const BASE_URL = `https://www.zohoapis.${location}/bigin/v2`;

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const responseData = response.body?.data;
    if (
      responseData &&
      Array.isArray(responseData) &&
      responseData.length > 0
    ) {
      const firstItem = responseData[0];
      if (firstItem.status === 'error' && firstItem.code) {
        const details = firstItem.details
          ? ` (Expected: ${firstItem.details.expected_data_type} for field: ${firstItem.details.api_name})`
          : '';
        throw new Error(
          `Bigin API Error (${firstItem.code}): ${firstItem.message}${details}`
        );
      }
    }

    return response.body;
  } catch (error: any) {
    if (error.response?.body) {
      const errorBody = error.response.body;

      if (
        errorBody?.data &&
        Array.isArray(errorBody.data) &&
        errorBody.data.length > 0
      ) {
        const firstError = errorBody.data[0];
        if (firstError.status === 'error' && firstError.code) {
          const details = firstError.details
            ? ` (Expected: ${firstError.details.expected_data_type} for field: ${firstError.details.api_name})`
            : '';
          throw new Error(
            `Bigin API Error (${firstError.code}): ${firstError.message}${details}`
          );
        }
      }

      if (Array.isArray(errorBody) && errorBody.length > 0) {
        const firstError = errorBody[0];
        if (firstError.status === 'error' && firstError.code) {
          throw new Error(
            `Bigin API Error (${firstError.code}): ${firstError.message}`
          );
        }
      }

      if (errorBody.code && errorBody.message) {
        throw new Error(
          `Bigin API Error (${errorBody.code}): ${errorBody.message}`
        );
      }
    }

    if (error.message && error.message.includes('Bigin API Error')) {
      throw error;
    }

    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
} 