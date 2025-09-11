import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export interface ForeplayCoApiCallProps {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  queryParams?: Record<string, string>;
  body?: any;
}

export async function foreplayCoApiCall({
  apiKey,
  method,
  resourceUri,
  queryParams,
  body,
}: ForeplayCoApiCallProps) {
  const baseUrl = "https://public.api.foreplay.co";

  return httpClient.sendRequest({
    method,
    url: `${baseUrl}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    queryParams,
    body,
  });
}
