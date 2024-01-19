import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { frameAuth } from '../..';

export const frameRegisterTrigger = ({
  name,
  displayName,
  eventType,
  description,
  sampleData,
}: {
  name: string;
  displayName: string;
  eventType: string;
  description: string;
  sampleData: unknown;
}) =>
  createTrigger({
    auth: frameAuth,
    name: `frame_trigger_${name}`,
    displayName,
    description,
    props: {
      account_id: Property.Dropdown({
        displayName: 'Account',
        description: 'Accounts accessible via a given User',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
          if (!auth) {
            return {
              options: [],
              disabled: true,
              placeholder: 'Please authenticate first',
            };
          }

          const response = await httpClient.sendRequest<Account[]>({
            method: HttpMethod.GET,
            url: `https://api.frame.io/v2/accounts`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as unknown as string,
            },
            queryParams: {},
          });

          try {
            return {
              disabled: false,
              options: response.body.map((account) => {
                return {
                  label: account.display_name,
                  value: account.id,
                };
              }),
            };
          } catch (error) {
            return {
              options: [],
              disabled: true,
              placeholder: `Couldn't load Accounts:\n${error}`,
            };
          }
        },
      }),
      team_id: Property.Dropdown({
        displayName: 'Team',
        description: 'Teams accessible via a given Account',
        required: true,
        refreshers: ['account_id'],
        options: async ({ auth, account_id }) => {
          if (!auth) {
            return {
              options: [],
              disabled: true,
              placeholder: 'Please authenticate first',
            };
          }
          if (!account_id) {
            return {
              options: [],
              disabled: true,
              placeholder: 'Please select an account first',
            };
          }

          const response = await httpClient.sendRequest<Team[]>({
            method: HttpMethod.GET,
            url: `https://api.frame.io/v2/accounts/${account_id}/teams`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as unknown as string,
            },
            queryParams: {},
          });

          try {
            return {
              disabled: false,
              options: response.body.map((team) => {
                return {
                  label: team.name,
                  value: team.id,
                };
              }),
            };
          } catch (error) {
            return {
              options: [],
              disabled: true,
              placeholder: `Couldn't load Teams:\n${error}`,
            };
          }
        },
      }),
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const response = await httpClient.sendRequest<WebhookInformation>({
        method: HttpMethod.POST,
        url: `https://api.frame.com/api/v2/teams/${context.propsValue.team_id}/hooks`,
        body: {
          name: displayName,
          url: context.webhookUrl,
          events: [eventType],
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth,
        },
      });
      await context.store.put<WebhookInformation>(
        `frame_${name}_trigger`,
        response.body
      );
    },
    async onDisable(context) {
      const webhook = await context.store.get<WebhookInformation>(
        `frame_${name}_trigger`
      );
      if (webhook != null) {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `https://api.frame.io/v2/hooks/${webhook.id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.auth,
          },
        };
        await httpClient.sendRequest(request);
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });

interface WebhookInformation {
  id: string;
  name: string;
  project_id: string;
  app_id: string;
  account_id: string;
  team_id: string;
  team: Team[];
  url: string;
  active: boolean;
  events: string[];
  secret: string;
  deleted_at: string;
  inserted_at: string;
  updated_at: string;
}

interface Team {
  id: string;
  name: string;
}

interface Account {
  id: string;
  display_name: string;
}
