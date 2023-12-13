import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { vboutCommon } from '.';

export class VboutClient {
  constructor(private apiKey: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method,
      url: vboutCommon.baseUrl + url,
      queryParams: { key: this.apiKey, ...query },
      body,
    });
    return res.body;
  }
}
