import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  HttpResponse,
} from '@activepieces/pieces-common';

type ContactCreateRequest = {
  first: string;
  last: string;
  email?: string;
  phone?: string;
  notes?: string;
  clientName?: string;
  defaultContact?: boolean;
  portalAccess?: boolean;
  invoiceContact?: boolean;
};

type ClientListResponse = {
  id: string;
  name: string;
};

export class MoxieCRMClient {
  constructor(private baseUrl: string, private apiKey: string) {
    // Remove trailing slash from base URL
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    body: any | undefined = undefined
  ): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
      method: method,
      url: `${this.baseUrl}${resourceUri}`,
      headers: {
        'X-API-KEY': this.apiKey,
      },
      body: body,
    });
  }
  async createContact(request: ContactCreateRequest) {
    return (
      await this.makeRequest(
        HttpMethod.POST,
        '/action/contacts/create',
        request
      )
    ).body;
  }
  async listClients(): Promise<ClientListResponse[]> {
    return (
      await this.makeRequest<ClientListResponse[]>(
        HttpMethod.GET,
        '/action/clients/list'
      )
    ).body;
  }
}
