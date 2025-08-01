import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
  AuthenticationType,
  HttpResponse
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

// Domain to API base URL mapping
const DOMAIN_TO_API_URL: Record<string, string> = {
  'com': 'https://www.zohoapis.com',
  'eu': 'https://www.zohoapis.eu',
  'in': 'https://www.zohoapis.in',
  'com.au': 'https://www.zohoapis.com.au',
  'jp': 'https://www.zohoapis.jp',
  'com.cn': 'https://www.zohoapis.com.cn',
  'sa': 'https://www.zohoapis.sa',
  'ca': 'https://www.zohoapis.ca'
};

export interface BiginApiCallParams {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  resourceUri: string;
  query?: QueryParams;
  body?: any;
}

export async function biginApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body
}: BiginApiCallParams): Promise<T> {
  const domain = auth.props?.['domain'] || 'com';
  const baseUrl = DOMAIN_TO_API_URL[domain];

  if (!baseUrl) {
    throw new Error(`Unsupported domain: ${domain}`);
  }

  const url = `${baseUrl}/bigin/v2${resourceUri}`;

  const request: HttpRequest = {
    method,
    url,
    queryParams: query,
    body,
    headers: {
      'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    // Handle Bigin-specific errors
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your access token.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. Please check your permissions.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Bigin server error. Please try again later.');
    }
    throw error;
  }
}

export class BiginClient {
  constructor(private auth: OAuth2PropertyValue) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body?: any
  ): Promise<T> {
    return biginApiCall<T>({
      auth: this.auth,
      method,
      resourceUri,
      query,
      body
    });
  }

  // Contacts
  async getContacts(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/Contacts', query);
  }

  async getContact(contactId: string) {
    return this.makeRequest(HttpMethod.GET, `/Contacts/${contactId}`);
  }

  async createContact(contactData: any) {
    return this.makeRequest(HttpMethod.POST, '/Contacts', undefined, { data: [contactData] });
  }

  async updateContact(contactId: string, contactData: any) {
    return this.makeRequest(HttpMethod.PUT, `/Contacts/${contactId}`, undefined, { data: [contactData] });
  }

  // Companies (Accounts)
  async getCompanies(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/Accounts', query);
  }

  async getCompany(companyId: string) {
    return this.makeRequest(HttpMethod.GET, `/Accounts/${companyId}`);
  }

  async createCompany(companyData: any) {
    return this.makeRequest(HttpMethod.POST, '/Accounts', undefined, { data: [companyData] });
  }

  async updateCompany(companyId: string, companyData: any) {
    return this.makeRequest(HttpMethod.PUT, `/Accounts/${companyId}`, undefined, { data: [companyData] });
  }

  // Pipeline Records (Deals)
  async getPipelineRecords(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/Pipelines', query);
  }

  async getPipelineRecord(recordId: string) {
    return this.makeRequest(HttpMethod.GET, `/Pipelines/${recordId}`);
  }

  async createPipelineRecord(recordData: any) {
    return this.makeRequest(HttpMethod.POST, '/Pipelines', undefined, { data: [recordData] });
  }

  async updatePipelineRecord(recordId: string, recordData: any) {
    return this.makeRequest(HttpMethod.PUT, `/Pipelines/${recordId}`, undefined, { data: [recordData] });
  }

  // Products
  async getProducts(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/Products', query);
  }

  async getProduct(productId: string) {
    return this.makeRequest(HttpMethod.GET, `/Products/${productId}`);
  }

  // Tasks
  async getTasks(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/Tasks', query);
  }

  async createTask(taskData: any) {
    return this.makeRequest(HttpMethod.POST, '/Tasks', undefined, { data: [taskData] });
  }

  async updateTask(taskId: string, taskData: any) {
    return this.makeRequest(HttpMethod.PUT, `/Tasks/${taskId}`, undefined, { data: [taskData] });
  }

  // Events
  async getEvents(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/Events', query);
  }

  async createEvent(eventData: any) {
    return this.makeRequest(HttpMethod.POST, '/Events', undefined, { data: [eventData] });
  }

  async updateEvent(eventId: string, eventData: any) {
    return this.makeRequest(HttpMethod.PUT, `/Events/${eventId}`, undefined, { data: [eventData] });
  }

  // Calls
  async getCalls(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/Calls', query);
  }

  async createCall(callData: any) {
    return this.makeRequest(HttpMethod.POST, '/Calls', undefined, { data: [callData] });
  }

  // Users
  async getUsers(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/users', query);
  }

  // Search
  async searchRecords(module: string, criteria: string, query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, `/search`, {
      ...query,
      module,
      criteria
    });
  }
}
