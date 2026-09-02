import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

function normalizeProjectUrl(projectUrl: string): string {
  const trimmed = projectUrl.trim().replace(/\/+$/, '');
  if (trimmed.length === 0) {
    throw new Error('Project URL is required');
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      'Project URL must start with http:// or https:// (for example https://forms.example.gov/intake)'
    );
  }
  return trimmed;
}

async function sendRequest<T>({
  auth,
  method,
  path,
  queryParams,
  body,
}: {
  auth: FormioAuth;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string>;
  body?: unknown;
}): Promise<FormioResponse<T>> {
  const request: HttpRequest = {
    method,
    url: `${normalizeProjectUrl(auth.projectUrl)}/${path.replace(/^\//, '')}`,
    headers: { 'x-token': auth.apiKey },
    ...(queryParams ? { queryParams } : {}),
    ...(body ? { body } : {}),
  };

  const response = await httpClient.sendRequest<T>(request);
  return {
    body: response.body,
    total: parseTotal(response.headers?.['content-range']),
  };
}

function parseTotal(contentRange: unknown): number | undefined {
  if (typeof contentRange !== 'string') {
    return undefined;
  }
  const total = Number(contentRange.split('/')[1]);
  return Number.isFinite(total) ? total : undefined;
}

export const formioCommon = {
  normalizeProjectUrl,

  async listForms({
    auth,
    type = 'form',
    limit = 100,
  }: {
    auth: FormioAuth;
    type?: 'form' | 'resource';
    limit?: number;
  }): Promise<FormioForm[]> {
    const { body } = await sendRequest<FormioForm[]>({
      auth,
      method: HttpMethod.GET,
      path: 'form',
      queryParams: { type, limit: String(limit) },
    });
    return Array.isArray(body) ? body : [];
  },

  async getForm({ auth, formPath }: { auth: FormioAuth; formPath: string }) {
    const { body } = await sendRequest<FormioForm>({
      auth,
      method: HttpMethod.GET,
      path: formPath,
    });
    return body;
  },

  async findFormId({
    auth,
    formPath,
  }: {
    auth: FormioAuth;
    formPath: string;
  }): Promise<string> {
    const form = await formioCommon.getForm({ auth, formPath });
    if (!form?._id) {
      throw new Error(`Form "${formPath}" was not found on this Form.io project`);
    }
    return form._id;
  },

  async createSubmission({
    auth,
    formPath,
    data,
  }: {
    auth: FormioAuth;
    formPath: string;
    data: Record<string, unknown>;
  }) {
    const { body } = await sendRequest<FormioSubmission>({
      auth,
      method: HttpMethod.POST,
      path: `${formPath}/submission`,
      body: { data },
    });
    return body;
  },

  async getSubmission({
    auth,
    formPath,
    submissionId,
  }: {
    auth: FormioAuth;
    formPath: string;
    submissionId: string;
  }) {
    const { body } = await sendRequest<FormioSubmission>({
      auth,
      method: HttpMethod.GET,
      path: `${formPath}/submission/${submissionId}`,
    });
    return body;
  },

  async findSubmissions({
    auth,
    formPath,
    queryParams,
  }: {
    auth: FormioAuth;
    formPath: string;
    queryParams: Record<string, string>;
  }): Promise<{ submissions: FormioSubmission[]; total: number | undefined }> {
    const { body, total } = await sendRequest<FormioSubmission[]>({
      auth,
      method: HttpMethod.GET,
      path: `${formPath}/submission`,
      queryParams,
    });
    return { submissions: Array.isArray(body) ? body : [], total };
  },

  async updateSubmission({
    auth,
    formPath,
    submissionId,
    data,
    merge,
  }: {
    auth: FormioAuth;
    formPath: string;
    submissionId: string;
    data: Record<string, unknown>;
    merge: boolean;
  }) {
    const existing = merge
      ? await formioCommon.getSubmission({ auth, formPath, submissionId })
      : undefined;

    const { body } = await sendRequest<FormioSubmission>({
      auth,
      method: HttpMethod.PUT,
      path: `${formPath}/submission/${submissionId}`,
      body: {
        _id: submissionId,
        data: existing ? { ...existing.data, ...data } : data,
      },
    });
    return body;
  },

  async deleteSubmission({
    auth,
    formPath,
    submissionId,
  }: {
    auth: FormioAuth;
    formPath: string;
    submissionId: string;
  }) {
    await sendRequest<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `${formPath}/submission/${submissionId}`,
    });
    return { deleted: true, submissionId };
  },

  async createWebhookAction({
    auth,
    formId,
    webhookUrl,
    events,
  }: {
    auth: FormioAuth;
    formId: string;
    webhookUrl: string;
    events: FormioActionMethod[];
  }): Promise<string> {
    const { body } = await sendRequest<FormioAction>({
      auth,
      method: HttpMethod.POST,
      path: `form/${formId}/action`,
      body: {
        title: 'Webhook',
        name: 'webhook',
        priority: 0,
        handler: ['after'],
        method: events,
        settings: { url: webhookUrl, method: 'post' },
      },
    });
    if (!body?._id) {
      throw new Error(
        'Form.io did not return an id for the webhook action it created'
      );
    }
    return body._id;
  },

  async deleteWebhookAction({
    auth,
    formId,
    actionId,
  }: {
    auth: FormioAuth;
    formId: string;
    actionId: string;
  }) {
    await sendRequest<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `form/${formId}/action/${actionId}`,
    });
  },

  async validateAuth(auth: FormioAuth): Promise<void> {
    await sendRequest<unknown>({
      auth,
      method: HttpMethod.GET,
      path: 'role',
    });
  },
};

export const FORMIO_AUTH_HEADER = 'x-token';

export type FormioAuth = {
  projectUrl: string;
  apiKey: string;
};

export type FormioActionMethod = 'create' | 'update' | 'delete';

export type FormioForm = {
  _id: string;
  title: string;
  name: string;
  path: string;
  type: string;
  created?: string;
  modified?: string;
};

export type FormioSubmission = {
  _id: string;
  form: string;
  data: Record<string, unknown>;
  owner?: string | null;
  roles?: unknown[];
  access?: unknown[];
  metadata?: Record<string, unknown>;
  externalIds?: unknown[];
  created?: string;
  modified?: string;
};

export type FormioAction = {
  _id: string;
  name: string;
  form: string;
  settings?: Record<string, unknown>;
};

export type FormioResponse<T> = {
  body: T;
  total: number | undefined;
};

export type FormioWebhookPayload = {
  request?: Record<string, unknown>;
  submission?: FormioSubmission;
  params?: { formId?: string; submissionId?: string };
};
