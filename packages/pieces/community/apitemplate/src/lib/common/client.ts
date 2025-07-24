import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';

export class APITemplateClient {
  private readonly baseUrl = 'https://rest.apitemplate.io';
  
  constructor(private readonly apiKey: string) {}

  async makeRequest<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    queryParams?: QueryParams
  ): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body,
      queryParams,
    };

    try {
      const response = await httpClient.sendRequest<T>(request);
      
      if (response.status >= 200 && response.status < 300) {
        return response.body;
      }
      
      throw new Error(`APITemplate API error: ${response.status} - ${JSON.stringify(response.body)}`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while making APITemplate API request');
    }
  }

  async createImage(templateId: string, data: any, overrides?: any): Promise<any> {
    const body = {
      ...data,
      ...(overrides && { overrides }),
    };
    
    const queryParams: QueryParams = {
      template_id: templateId,
    };
    
    return this.makeRequest(HttpMethod.POST, '/v1/create', body, queryParams);
  }

  async createPdfFromTemplate(templateId: string, data: any): Promise<any> {
    const body = data;
    
    const queryParams: QueryParams = {
      template_id: templateId,
      export_type: 'pdf',
    };
    
    return this.makeRequest(HttpMethod.POST, '/v1/create', body, queryParams);
  }

  async createPdfFromHtml(html: string, data?: any): Promise<any> {
    const body = {
      html,
      ...(data && data),
    };
    
    return this.makeRequest(HttpMethod.POST, '/v2/create-pdf-from-html', body);
  }

  async createPdfFromUrl(url: string, options?: any): Promise<any> {
    const body = {
      url,
      ...options,
    };
    
    return this.makeRequest(HttpMethod.POST, '/v2/create-pdf-from-url', body);
  }

  async createPdfAdvanced(options: any): Promise<any> {
    return this.makeRequest(HttpMethod.POST, '/v2/create-pdf', options);
  }


  async deleteObject(transactionRef: string): Promise<any> {
    const queryParams: QueryParams = {
      transaction_ref: transactionRef,
    };
    
    return this.makeRequest(HttpMethod.GET, '/v1/delete-object', undefined, queryParams);
  }

  async getAccountInfo(): Promise<any> {
    return this.makeRequest(HttpMethod.GET, '/v1/list-templates');
  }

  async listObjects(params?: {
    limit?: number;
    offset?: number;
    template_id?: string;
    group_name?: string;
  }): Promise<any> {
    const queryParams: QueryParams = {};
    if (params) {
      if (params.limit !== undefined) queryParams.limit = String(params.limit);
      if (params.offset !== undefined) queryParams.offset = String(params.offset);
      if (params.template_id) queryParams.template_id = params.template_id;
      if (params.group_name) queryParams.group_name = params.group_name;
    }
    return this.makeRequest(HttpMethod.GET, '/v1/list-objects', undefined, queryParams);
  }
}