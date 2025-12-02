
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function getbussinessUnitId(apiKey: string, domainName: string) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `https://api.trustpilot.com/v1/business-units/find?name=${encodeURIComponent(domainName)}`,
    headers: {
      apikey: apiKey,
    },
  });

  return response.body;
}