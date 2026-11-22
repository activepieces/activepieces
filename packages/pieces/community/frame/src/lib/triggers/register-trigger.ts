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
import { frameCommon } from '../common';

export const frameRegisterTrigger = ({
  name,
  displayName,
  eventType,
  description,
  aiMetadata,
  sampleData,
}: {
  name: string;
  displayName: string;
  eventType: string;
  description: string;
  aiMetadata?: { description: string };
  sampleData: unknown;
}) =>
  createTrigger({
    auth: frameAuth,
    name: `frame_trigger_${name}`,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: aiMetadata ?? {
      description: `Fires via a Frame.io webhook whenever the "${eventType}" event occurs on the selected team. Each event delivers the matching Frame.io resource (project, asset, comment, etc.) so an agent can react to changes in a Frame.io account in real time.`,
    },
    props: {
      account_id: Property.Dropdown({
        displayName: 'Account',
        description: 'The Frame.io account that owns the team.',
        required: true,
        refreshers: [],
        auth: frameAuth,
        options: async ({ auth }) => {
          if (!auth) {
            return {
              options: [],
              disabled: true,
              placeholder: 'Connect your Frame.io account first',
            };
          }

          try {
            const response = await httpClient.sendRequest<Account[]>({
              method: HttpMethod.GET,
              url: `${frameCommon.baseUrl}/accounts`,
              authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.secret_text,
              },
              queryParams: {},
            });

            if (response.body.length === 0) {
              return {
                disabled: false,
                options: [],
                placeholder: 'No accounts found.',
              };
            }

            return {
              disabled: false,
              options: response.body.map((account) => {
                return {
                  label: account.display_name,
                  value: account.id,
                };
              }),
            };
          } catch {
            return {
              options: [],
              disabled: true,
              placeholder: `Couldn't load accounts. Check your connection.`,
            };
          }
        },
      }),
      team_id: Property.Dropdown({
        displayName: 'Team',
        description: 'Every project in this team can start the flow.',
        required: true,
        refreshers: ['account_id'],
        auth: frameAuth,
        options: async ({ auth, account_id }) => {
          if (!auth) {
            return {
              options: [],
              disabled: true,
              placeholder: 'Connect your Frame.io account first',
            };
          }
          if (!account_id) {
            return {
              options: [],
              disabled: true,
              placeholder: 'Select an account first',
            };
          }

          try {
            const response = await httpClient.sendRequest<Team[]>({
              method: HttpMethod.GET,
              url: `${frameCommon.baseUrl}/accounts/${account_id}/teams`,
              authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.secret_text,
              },
              queryParams: {},
            });

            if (response.body.length === 0) {
              return {
                disabled: false,
                options: [],
                placeholder: 'No teams found in this account.',
              };
            }

            return {
              disabled: false,
              options: response.body.map((team) => {
                return {
                  label: team.name,
                  value: team.id,
                };
              }),
            };
          } catch {
            return {
              options: [],
              disabled: true,
              placeholder: `Couldn't load teams. Check your connection.`,
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
        url: `${frameCommon.baseUrl}/teams/${context.propsValue.team_id}/hooks`,
        body: {
          name: displayName,
          url: context.webhookUrl,
          events: [eventType],
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
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
          url: `${frameCommon.baseUrl}/hooks/${webhook.id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.auth.secret_text,
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
