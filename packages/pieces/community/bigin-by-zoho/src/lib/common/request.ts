import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { API_ENDPOINTS } from './constants';

async function fireHttpRequest({
  method,
  path,
  body,
  access_token,
}: {
  method: HttpMethod;
  path: string;
  access_token: string;
  body?: unknown;
}) {
  try {
    const res = await httpClient.sendRequest({
      method,
      url: path,
      headers: {
        Accept: 'application/json',
        Authorization: `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (res.status === 204 || res.body === '' || res.body === undefined || res.body === null) {
      return {};
    }
    return res.body;
  } catch (err) {
    throw toBiginApiError(err);
  }
}

async function biginRequest({
  connection,
  method,
  path,
  query,
  body,
}: {
  connection: BiginConnection;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const queryString = qs.toString();
  const result = await fireHttpRequest({
    method,
    path: `${connection.apiDomain}/bigin/v2${path}${queryString ? `?${queryString}` : ''}`,
    access_token: connection.accessToken,
    body,
  });
  return isObject(result) ? result : {};
}

function getBiginConnection(auth: { access_token: string; data: Record<string, unknown> }): BiginConnection {
  const apiDomain = auth.data['api_domain'];
  return {
    accessToken: auth.access_token,
    apiDomain: typeof apiDomain === 'string' && apiDomain !== '' ? apiDomain : 'https://www.zohoapis.com',
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readZohoErrorDetail(body: unknown): { code?: string; message?: string } {
  if (!isObject(body)) {
    return typeof body === 'string' && body !== '' ? { message: body } : {};
  }
  const first = Array.isArray(body['data']) ? body['data'][0] : undefined;
  const source = isObject(first) ? first : body;
  const code = source['code'];
  const message = source['message'];
  return {
    code: typeof code === 'string' ? code : undefined,
    message: typeof message === 'string' ? message : undefined,
  };
}

function toBiginApiError(err: unknown): Error {
  if (err instanceof BiginApiError) return err;
  const response = isObject(err) && isObject(err['response']) ? err['response'] : undefined;
  if (!response || typeof response['status'] !== 'number') {
    return err instanceof Error ? err : new Error(String(err));
  }
  const status = response['status'];
  const responseBody = response['body'];
  const { code, message } = readZohoErrorDetail(responseBody);
  return new BiginApiError({ status, code, detail: message ?? 'Request failed', responseBody });
}

class BiginApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly responseBody: unknown;
  constructor({
    status,
    code,
    detail,
    responseBody,
  }: {
    status: number;
    code?: string;
    detail: string;
    responseBody: unknown;
  }) {
    super(`Bigin API error (HTTP ${status}${code ? `, ${code}` : ''}): ${detail}`);
    this.name = 'BiginApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

function assertWriteSucceeded(item: unknown): void {
  if (isObject(item) && item['status'] === 'error') {
    const { code, message } = readZohoErrorDetail(item);
    throw new BiginApiError({ status: 400, code, detail: message ?? 'Write failed', responseBody: item });
  }
}

export const biginApiService = {
  createWebhook: async (
    access_token: string,
    payload: unknown,
    api_domain: string
  ) => {
    const res = await fireHttpRequest({
      method: HttpMethod.POST,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.WEBHOOKS}`,
      body: payload,
      access_token,
    });

    return res;
  },
  updateWebhook: async (
    access_token: string,
    payload: unknown,
    api_domain: string
  ) => {
    return fireHttpRequest({
      method: HttpMethod.PATCH,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.WEBHOOKS}`,
      body: payload,
      access_token,
    });
  },
  deleteWebhook: async (
    access_token: string,
    api_domain: string,
    channel_id: string
  ) => {
    return fireHttpRequest({
      method: HttpMethod.DELETE,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.WEBHOOKS}?channel_ids=${channel_id}`,
      access_token,
    });
  },
  fetchUsers: async (
    access_token: string,
    api_domain: string,
    params?: { type?: string; page?: number; per_page?: number }
  ) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const query = qs.toString();
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.USERS}${query ? `?${query}` : ''}`,
      access_token,
    });
  },
  createCompany: async (
    access_token: string,
    api_domain: string,
    body: unknown
  ) => {
    return fireHttpRequest({
      method: HttpMethod.POST,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.COMPANIES}`,
      access_token,
      body,
    });
  },
  updateCompany: async (
    access_token: string,
    api_domain: string,
    body: unknown
  ) => {
    return fireHttpRequest({
      method: HttpMethod.PUT,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.COMPANIES}`,
      access_token,
      body,
    });
  },
  fetchCompanies: async (access_token: string, api_domain: string) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.COMPANIES}?fields=Owner,Account_Name,Phone,Website,Tag,Description,Billing_Street,Billing_State,Billing_Country,Billing_Code`,
      access_token,
    });
  },
  createContact: async (
    access_token: string,
    api_domain: string,
    body: unknown
  ) => {
    return fireHttpRequest({
      method: HttpMethod.POST,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.CONTACTS}`,
      access_token,
      body,
    });
  },
  updateContact: async (
    access_token: string,
    api_domain: string,
    body: unknown
  ) => {
    return fireHttpRequest({
      method: HttpMethod.PUT,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.CONTACTS}`,
      access_token,
      body,
    });
  },
  fetchTags: async (
    access_token: string,
    api_domain: string,
    module: string
  ) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.TAGS}?module=${module}`,
      access_token,
    });
  },
  fetchContacts: async (access_token: string, api_domain: string) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.CONTACTS}?fields=First_Name,Last_Name,Title,Email,Mobile,Email_Opt_Out,Owner,Account_Name,Tag,Description,Mailing_Street,Mailing_City,Mailing_State,Mailing_Country,Mailing_Zip`,
      access_token,
    });
  },
  fetchPipelinesRecords: async (access_token: string, api_domain: string) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.PIPELINES}?fields=Deal_Name,Stage,Owner,Description,Contact_Name,Account_Name,Amount,Closing_Date,Sub_Pipeline,Tag`,
      access_token,
    });
  },
  createPipelineRecord: async (
    access_token: string,
    api_domain: string,
    body: unknown
  ) => {
    return fireHttpRequest({
      method: HttpMethod.POST,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.PIPELINES}`,
      access_token,
      body,
    });
  },
  updatePipelineRecord: async (
    access_token: string,
    api_domain: string,
    body: unknown
  ) => {
    return fireHttpRequest({
      method: HttpMethod.PUT,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.PIPELINES}`,
      access_token,
      body,
    });
  },
  fetchProducts: async (access_token: string, api_domain: string) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.PRODUCTS}?fields=Product_Name,Owner,Product_Code,Product_Category,Unit_Price,Description,Tag,Product_Active`,
      access_token,
    });
  },
  fetchTasks: async (access_token: string, api_domain: string) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.TASKS}?fields=Subject,Status,Owner,Due_Date,Description,Priority,Related_To,Tags,Remind_At,Recurring_Activity,$related_module`,
      access_token,
    });
  },
  createCall: async (access_token: string, api_domain: string, body: unknown) => {
    return fireHttpRequest({
      method: HttpMethod.POST,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.CALLS}`,
      access_token,
      body,
    });
  },
  createEvent: async (access_token: string, api_domain: string, body: unknown) => {
    return fireHttpRequest({
      method: HttpMethod.POST,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.EVENTS}`,
      access_token,
      body,
    });
  },
  fetchEvents: async (access_token: string, api_domain: string) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.EVENTS}?fields=Owner,Event_Title,Start_DateTime,End_DateTime,Description,Recurring_Activity,Participants,Related_To,Tag,Remind_At,$related_module,All_day,Venue`,
      access_token,
    });
  },
  updateEvent: async (access_token: string, api_domain: string, body: unknown) => {
    return fireHttpRequest({
      method: HttpMethod.PUT,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.EVENTS}`,
      access_token,
      body,
    });
  },
  createTask: async (access_token: string, api_domain: string, body: unknown) => {
    return fireHttpRequest({
      method: HttpMethod.POST,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.TASKS}`,
      access_token,
      body,
    });
  },
  updateTask: async (access_token: string, api_domain: string, body: unknown) => {
    return fireHttpRequest({
      method: HttpMethod.PUT,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.TASKS}`,
      access_token,
      body,
    });
  },
  fetchModules: async (access_token: string, api_domain: string) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.MODULES}`,
      access_token,
    });
  },
  fetchLayouts: async (
    access_token: string,
    api_domain: string,
    module_name: string
  ) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.LAYOUTS}?module=${module_name}`,
      access_token,
    });
  },
  fetchModuleFields: async (
    access_token: string,
    api_domain: string,
    module_name: string
  ) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2${API_ENDPOINTS.FIELDS}?module=${module_name}`,
      access_token,
    });
  },
  searchRecords: async (
    access_token: string,
    api_domain: string,
    module_name: string,
    query: {
      key: string;
      value: string;
    }
  ) => {
    return fireHttpRequest({
      method: HttpMethod.GET,
      path: `${api_domain}/bigin/v2/${module_name}/search?${encodeURIComponent(query.key)}=${encodeURIComponent(query.value)}`,
      access_token,
    });
  }
};


type BiginConnection = {
  accessToken: string;
  apiDomain: string;
};

export {
  BiginApiError,
  biginRequest,
  getBiginConnection,
  isObject,
  assertWriteSucceeded,
  readZohoErrorDetail,
};
export type { BiginConnection };
