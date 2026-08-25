import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type GetClientByIdResponse = {
  email: string;
  id: string;
  accountId: string;
  accountName: string;
  dataEntityId: string;
};

type GetClientListResponse = GetClientByIdResponse[];

export class Client {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(host: string, appKey: string, appToken: string) {
    this.baseURL = 'https://' + host;
    this.headers = {
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    };
  }

  async getClientById(clientID: number): Promise<GetClientByIdResponse> {
    const route = `/api/dataentities/CL/documents/`;
    const response = await httpClient.sendRequest<GetClientByIdResponse>({
      method: HttpMethod.GET,
      url: this.baseURL + route + clientID,
      headers: this.headers,
    });
    return response.body;
  }

  async getClientList(): Promise<GetClientListResponse> {
    const route = '/api/dataentities/CL/search';
    const response = await httpClient.sendRequest<GetClientListResponse>({
      method: HttpMethod.GET,
      url: this.baseURL + route,
      headers: this.headers,
    });
    return response.body;
  }
}
