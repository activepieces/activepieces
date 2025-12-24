import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { url } from 'inspector';

export async function makeRequest(
  account_name: string,
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  //`https://${account_name}.sandbox-quadernoapp.com/api/${path}`
  //`https://${account_name}.quadernoapp.com/api/${path}`
  try {
    console.log(`https://${account_name}.sandbox-quadernoapp.com/api/${path}`)
    const response = await httpClient.sendRequest({
      method,
      url: `https://${account_name}.sandbox-quadernoapp.com/api/${path}`,
      headers: {
        'API-Key': `${api_key}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
