import {
  DropdownOption, PiecePropValueSchema, Property
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { volubileAuth } from '../auth';

type AgentListResponse = {
  totalPages: number;
  totalElements: number;
  content: {
    id: string;
    name: string;
  }[];
};

export enum TriggerType {
  PRE_CALL = 'PRE_CALL',
  LIVE_CALL = 'LIVE_CALL',
  POST_CALL = 'POST_CALL',
}

export enum ActionStatus {
  DISABLED = 'DISABLED',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface WebhookActionConfig {
  url: string;
  trigger: TriggerType;
  name: string;
  status: ActionStatus;
}

export interface PreWebhookActionConfig extends WebhookActionConfig {
  context: any;
}

export interface LiveWebhookActionConfig extends WebhookActionConfig {
  name: any;
  description: any;
  schema: any;
}

export const agentsDropdown = Property.Dropdown<string>({
  displayName: 'Agent',
  description: 'Agent Name',
  required: true,
  refreshers: [],
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    const authValue = auth as PiecePropValueSchema<typeof volubileAuth>;

    const options: DropdownOption<string>[] = [];
    let hasMore = true;
    let page = 1;
    const pageSize= '100';

    do {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${authValue.baseUrl}/agents`,
        headers: {
          'X-Api-Key': authValue.apiKey as string,
        },
        queryParams : {
          'size': pageSize,
          'page': page.toString(),


        }
      };

      const response = await httpClient.sendRequest<AgentListResponse>(request);

      for (const agent of response.body.content) {
        options.push({ label: agent.name, value: agent.id });
      }

      hasMore =
        response.body.totalPages != undefined &&
        page < response.body.totalPages;

      page++;
    } while (hasMore);

    return {
      disabled: false,
      placeholder: 'Select form',
      options,
    };
  },
});

export const volubileCommon = {
  getContext: async (auth: PiecePropValueSchema<typeof volubileAuth>, agentId: string, trigger: TriggerType) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${auth.baseUrl}/integrations/hooks/agents/${agentId}/${trigger}/context`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': auth.apiKey,
      },
      queryParams: {},
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
  subscribeWebhook: async (
    auth: PiecePropValueSchema<typeof volubileAuth>,
    agentId: string,
    config: WebhookActionConfig,
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/integrations/hooks/agents/${agentId}/subscribe`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': auth.apiKey,
      },
      body: {
        ...config,
      },
      queryParams: {},
    };

    await httpClient.sendRequest(request);
  },
  unsubscribeWebhook: async (
    auth: PiecePropValueSchema<typeof volubileAuth>,
    config: WebhookActionConfig,
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/integrations/hooks/unsubscribe`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': auth.apiKey,
      },
      body: {
        ...config,
      },
    };
    return await httpClient.sendRequest<ActionStatus>(request);
  },
};
