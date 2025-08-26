import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PaperformFormsResponse, PaperformWebhookResponse, PaperformSubmissionsResponse, PaperformPartialSubmissionsResponse, PaperformCouponsResponse, PaperformFieldsResponse, PaperformProductsResponse, PaperformSpacesResponse, PaperformField, PaperformSubmission } from './types';

export const paperformCommon = {
  baseUrl: 'https://api.paperform.co/v1',

  async apiCall<T>({
    method,
    url,
    body,
    auth,
    headers,
  }: {
    method: HttpMethod;
    url: string;
    body?: any;
    auth: string | { apiKey: string };
    headers?: Record<string, string>;
  }): Promise<T> {
    const apiKey = typeof auth === 'string' ? auth : auth.apiKey;
    
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`Paperform API error: ${response.status}`);
    }

    return response.body;
  },

  async getSpaces({
    auth,
    search,
    limit = 20,
    skip = 0,
    afterId,
    beforeId,
    beforeDate,
    afterDate,
    sort = 'DESC',
  }: {
    auth: string | { apiKey: string };
    search?: string;
    limit?: number;
    skip?: number;
    afterId?: string;
    beforeId?: string;
    beforeDate?: string;
    afterDate?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    if (afterId) params.append('after_id', afterId);
    if (beforeId) params.append('before_id', beforeId);
    if (beforeDate) params.append('before_date', beforeDate);
    if (afterDate) params.append('after_date', afterDate);
    if (sort) params.append('sort', sort);

    return this.apiCall<PaperformSpacesResponse>({
      method: HttpMethod.GET,
      url: `/spaces?${params.toString()}`,
      auth,
    });
  },

  async getForms({
    auth,
    search,
    limit = 20,
    skip = 0,
    afterId,
    beforeId,
    beforeDate,
    afterDate,
    sort = 'DESC',
  }: {
    auth: string | { apiKey: string };
    search?: string;
    limit?: number;
    skip?: number;
    afterId?: string;
    beforeId?: string;
    beforeDate?: string;
    afterDate?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    if (afterId) params.append('after_id', afterId);
    if (beforeId) params.append('before_id', beforeId);
    if (beforeDate) params.append('before_date', beforeDate);
    if (afterDate) params.append('after_date', afterDate);
    if (sort) params.append('sort', sort);

    return this.apiCall<PaperformFormsResponse>({
      method: HttpMethod.GET,
      url: `/forms?${params.toString()}`,
      auth,
    });
  },

  async getForm({
    formId,
    auth,
  }: {
    formId: string;
    auth: string | { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: `/forms/${formId}`,
      auth,
    });
  },

  async getFormFields({
    formSlugOrId,
    auth,
    search,
  }: {
    formSlugOrId: string;
    auth: string | { apiKey: string };
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    return this.apiCall<PaperformFieldsResponse>({
      method: HttpMethod.GET,
      url: `/forms/${formSlugOrId}/fields?${params.toString()}`,
      auth,
    });
  },

  async getSubmissions({
    formId,
    auth,
    limit = 50,
    skip = 0,
  }: {
    formId: string;
    auth: string | { apiKey: string };
    limit?: number;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    return this.apiCall<PaperformSubmissionsResponse>({
      method: HttpMethod.GET,
      url: `/forms/${formId}/submissions?${params.toString()}`,
      auth,
    });
  },

  async getPartialSubmissions({
    formSlugOrId,
    auth,
    limit = 50,
    skip = 0,
  }: {
    formSlugOrId: string;
    auth: string | { apiKey: string };
    limit?: number;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    return this.apiCall<PaperformPartialSubmissionsResponse>({
      method: HttpMethod.GET,
      url: `/forms/${formSlugOrId}/partial-submissions?${params.toString()}`,
      auth,
    });
  },

  async getCoupons({
    formSlugOrId,
    auth,
    limit = 50,
    skip = 0,
  }: {
    formSlugOrId: string;
    auth: string | { apiKey: string };
    limit?: number;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    return this.apiCall<PaperformCouponsResponse>({
      method: HttpMethod.GET,
      url: `/forms/${formSlugOrId}/coupons?${params.toString()}`,
      auth,
    });
  },

  async getProducts({
    formSlugOrId,
    auth,
    search,
    limit = 50,
    skip = 0,
  }: {
    formSlugOrId: string;
    auth: string | { apiKey: string };
    search?: string;
    limit?: number;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    return this.apiCall<PaperformProductsResponse>({
      method: HttpMethod.GET,
      url: `/forms/${formSlugOrId}/products?${params.toString()}`,
      auth,
    });
  },

  async getSubmission({
    submissionId,
    auth,
  }: {
    submissionId: string;
    auth: string | { apiKey: string };
  }) {
    return this.apiCall<{results:{submission:PaperformSubmission}}>({
      method: HttpMethod.GET,
      url: `/submissions/${submissionId}`,
      auth,
    });
  },

  async getPartialSubmission({
    submissionId,
    auth,
  }: {
    submissionId: string;
    auth: string | { apiKey: string };
  }) {
    return this.apiCall<{results:{'partial-submission':PaperformSubmission}}>({
      method: HttpMethod.GET,
      url: `/partial-submissions/${submissionId}`,
      auth,
    });
  },

  async createWebhook({
    formId,
    webhookUrl,
    auth,
    eventType,
  }: {
    formId: string;
    webhookUrl: string;
    auth: string | { apiKey: string };
    eventType: string;
  }) {
    return this.apiCall<PaperformWebhookResponse>({
      method: HttpMethod.POST,
      url: `/forms/${formId}/webhooks`,
      body: {
        target_url: webhookUrl,
        triggers: [eventType],
      },
      auth,
    });
  },

  async deleteWebhook({
    webhookId,
    auth,
  }: {
    webhookId: string;
    auth: string | { apiKey: string };
  }) {
      return this.apiCall({
        method: HttpMethod.DELETE,
        url: `/webhooks/${webhookId}`,
        auth,
      });
  },

  transformSubmissionData(
    formFields:PaperformField[],
    submissionFields:Record<string,any>
  ):Record<string,any>{
    const fieldMap: Record<string, string> = formFields.reduce((acc, field) => {
		acc[field.key] = field.title;
		return acc;
	}, {} as Record<string, string>);

	const transformedFields: Record<string, any> = {};

	for (const [key, value] of Object.entries(submissionFields)) {
		const label = fieldMap[key] ?? key;
		transformedFields[label] = value;
	}

	return transformedFields;
  }
};

