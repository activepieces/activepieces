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

type ProjectCreateRequest = {
  name: string;
  clientName: string;
  startDate?: string;
  dueDate?: string;
  portalAccess: string;
  showTimeWorkedInPortal?: boolean;
  feeSchedule: {
    feeType: string;
    amount?: number;
    retainerSchedule?: string;
    estimateMax?: number;
    estimateMin?: number;
    retainerStart?: string;
    retainerTiming?: string;
    retainerOverageRate?: number;
    taxable?: boolean;
  };
};

type ClientCreateRequest = {
  name: string;
  clientType: string;
  initials?: string;
  address1?: string;
  address2?: string;
  city?: string;
  locality?: string;
  postal?: string;
  country?: string;
  website?: string;
  phone?: string;
  color?: string;
  taxId?: string;
  leadSource?: string;
  archive: boolean;
  payInstructions?: string;
  hourlyAmount?: number;
  roundingIncrement?: number;
  currency?: string;
  stripeClientId?: string;
  notes?: string;
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
  async createClient(request: ClientCreateRequest) {
    return (
      await this.makeRequest(HttpMethod.POST, '/action/clients/create', request)
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
  async listInvoiceTemplates(): Promise<string[]> {
    return (
      await this.makeRequest<string[]>(
        HttpMethod.GET,
        '/action/invoiceTemplates/list'
      )
    ).body;
  }

  async createProject(request: ProjectCreateRequest) {
    return (
      await this.makeRequest(
        HttpMethod.POST,
        '/action/projects/create',
        request
      )
    ).body;
  }
}
