import axios, { Axios } from 'axios';

type GetClientByIdResponse = {
  email: string;
  id: string;
  accountId: string;
  accountName: string;
  dataEntityId: string;
};

type GetClientListResponse = GetClientByIdResponse[];

export class Client {
  api: Axios;

  constructor(host: string, appKey: string, appToken: string) {
    this.api = axios.create({
      baseURL: 'https://' + host,
      headers: {
        'X-VTEX-API-AppKey': appKey,
        'X-VTEX-API-AppToken': appToken,
      },
    });
  }

  async getClientById(clientID: number): Promise<GetClientByIdResponse> {
    const route = `/api/dataentities/CL/documents/`;
    const response = await this.api.get<GetClientByIdResponse>(
      route + clientID
    );
    return response.data;
  }

  async getClientList(): Promise<GetClientListResponse> {
    const route = '/api/dataentities/CL/search';
    const response = await this.api.get<GetClientListResponse>(route);
    return response.data;
  }
}
