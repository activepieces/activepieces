import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
  AuthenticationType
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.netlify.com/api/v1';

export interface NetlifyApiCallParams {
  token: string;
  method: HttpMethod;
  endpoint: string;
  query?: QueryParams;
  body?: any;
}

export async function netlifyApiCall<T extends HttpMessageBody>({
  token,
  method,
  endpoint,
  query,
  body
}: NetlifyApiCallParams): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const request: HttpRequest = {
    method,
    url,
    queryParams: query,
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token
    },
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    // Handle Netlify-specific errors
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your Personal Access Token.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. Please check your permissions.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Netlify server error. Please try again later.');
    }
    
    // Return the original error message if available
    const errorMessage = error.response?.body?.message || error.message || 'An unknown error occurred';
    throw new Error(errorMessage);
  }
}

export class NetlifyClient {
  constructor(private token: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    endpoint: string,
    query?: QueryParams,
    body?: any
  ): Promise<T> {
    return netlifyApiCall<T>({
      token: this.token,
      method,
      endpoint,
      query,
      body
    });
  }

  // Sites
  async getSites(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/sites', query);
  }

  async getSite(siteId: string) {
    return this.makeRequest(HttpMethod.GET, `/sites/${siteId}`);
  }

  // Deploys
  async getDeploys(siteId: string, query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, `/sites/${siteId}/deploys`, query);
  }

  async getDeploy(deployId: string) {
    return this.makeRequest(HttpMethod.GET, `/deploys/${deployId}`);
  }

  async createDeploy(siteId: string, deployData: any) {
    return this.makeRequest(HttpMethod.POST, `/sites/${siteId}/deploys`, undefined, deployData);
  }

  async startDeploy(siteId: string) {
    return this.makeRequest(HttpMethod.POST, `/sites/${siteId}/builds`);
  }

  // Files
  async getDeployFiles(deployId: string) {
    return this.makeRequest(HttpMethod.GET, `/deploys/${deployId}/files`);
  }

  async getDeployFile(deployId: string, filePath: string) {
    return this.makeRequest(HttpMethod.GET, `/deploys/${deployId}/files/${filePath}`);
  }

  // Forms
  async getForms(siteId: string) {
    return this.makeRequest(HttpMethod.GET, `/sites/${siteId}/forms`);
  }

  async getFormSubmissions(formId: string, query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, `/forms/${formId}/submissions`, query);
  }

  // Webhooks
  async createWebhook(siteId: string, webhookData: any) {
    return this.makeRequest(HttpMethod.POST, `/sites/${siteId}/hooks`, undefined, webhookData);
  }

  async deleteWebhook(hookId: string) {
    return this.makeRequest(HttpMethod.DELETE, `/hooks/${hookId}`);
  }

  async getWebhooks(siteId: string) {
    return this.makeRequest(HttpMethod.GET, `/sites/${siteId}/hooks`);
  }

  // User
  async getUser() {
    return this.makeRequest(HttpMethod.GET, '/user');
  }
}
