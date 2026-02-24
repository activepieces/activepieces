import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function makeRequest(
  account_name: string,
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  
) {
  try {
    // const baseUrl = isSandbox
    //   ? `https://${account_name}.sandbox-quadernoapp.com/api`
    //   : `https://${account_name}.quadernoapp.com/api`;

    const credentials = Buffer.from(`${api_key}:x`).toString('base64');
    console.log(`https://${account_name}.quadernoapp.com/api${path}`);
    const response = await httpClient.sendRequest({
      method,
      url: `https://${account_name}.quadernoapp.com/api${path}`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
        api_version: '20241028',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
