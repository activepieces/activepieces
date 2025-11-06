import {
  Property,
  DropdownOption,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';

// export const API_URL = 'https://api.opnform.com';
export const API_URL = 'https://opnform.test';

type WorkspaceListResponse = {
  id: string;
  name: string;
}[];

type FormListResponse = {
  meta: {
    current_page: number;
    from: number; 
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  data: {
    id: string;
    title: string;
    slug?: string;
  }[];
};

export const workspaceIdProp = Property.Dropdown<string>({
  displayName: 'Workspace',
  description: 'Workspace Name',
  required: true,
  refreshers: [],
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect Opnform account',
        options: [],
      };
    }

    const accessToken = auth as string;
    const options: DropdownOption<string>[] = [];

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${API_URL}/open/workspaces`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      }
    };

    const response = await httpClient.sendRequest<WorkspaceListResponse>(request);

    for (const workspace of response.body) {
      options.push({ label: workspace.name, value: workspace.id });
    }

    return {
      disabled: false,
      placeholder: 'Select workspace',
      options,
    };
  },
});

export const formIdProp = Property.Dropdown<string>({
  displayName: 'Form',
  description: 'Form Name',
  required: true,
  refreshers: ['workspaceId'],
  async options({ auth, workspaceId }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect Opnform account',
        options: [],
      };
    }
    
    if (!workspaceId) {
      return {
        disabled: true,
        placeholder: 'Select workspace',
        options: [],
      };
    }

    const accessToken = auth as string;

    const options: DropdownOption<string>[] = [];
    let hasMore = true;
    let page = 1;

    do {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API_URL}/open/workspaces/${workspaceId}/forms`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        queryParams: {
          page: page.toString(),
        },
      };

      const response = await httpClient.sendRequest<FormListResponse>(request);

      for (const form of response.body.data) {
        options.push({ label: form.title, value: form.id });
      }

      hasMore =
        response.body.meta != undefined &&
        response.body.meta.current_page < response.body.meta.last_page;

      page++;
    } while (hasMore);

    return {
      disabled: false,
      placeholder: 'Select form',
      options,
    };
  },
});

export const opnformCommon = {
  baseUrl: API_URL,
  checkExistsIntegration: async (
    formId: string,
    flowUrl: string,
    accessToken: string
  ) => {
    // Fetch all integrations for this form
    const allIntegrations = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${opnformCommon.baseUrl}/open/forms/${formId}/integrations`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    });
    const integration = allIntegrations.body.some((integration: any) =>
      integration.integration_id === 'activepieces' && integration.data.provider_url === flowUrl
    );
    return integration ? integration.id : null;
  },
  createIntegration: async (
    formId: string,
    webhookUrl: string,
    flowUrl: string,
    accessToken: string
  ) => {
    // Check if the integration already exists
    const existingIntegrationId = await opnformCommon.checkExistsIntegration(formId, flowUrl, accessToken);
    if(existingIntegrationId){
      return existingIntegrationId;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${opnformCommon.baseUrl}/open/forms/${formId}/integrations`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        'integration_id': 'activepieces',
        'status': 'active',
        'data': {
          'webhook_url': webhookUrl,
          'provider_url': flowUrl
        }
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      queryParams: {},
    };

    const response = await httpClient.sendRequest(request);
    return (response as any)?.form_integration?.id as number || null;
  },
  deleteIntegration: async (
    formId: string,
    integrationId: number,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${opnformCommon.baseUrl}/open/forms/${formId}/integrations/${integrationId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  },
};
