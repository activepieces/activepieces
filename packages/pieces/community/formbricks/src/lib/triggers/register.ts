import {
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { formBricksAuth } from '../..';

export const formBricksRegisterTrigger = ({
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
    auth: formBricksAuth,
    name: `formbricks_trigger_${name}`,
    displayName,
    description,
    aiMetadata,
    props: {
      organization_id: Property.ShortText({
        displayName: 'Organization ID',
        description:
          'The Organization ID can be found in the URL when you are logged into Formbricks. For example, if the URL is https://app.formbricks.com/organizations/cljold01t0000qh8ewzigzmjk/surveys, then the Organization ID is cljold01t0000qh8ewzigzmjk.',
        required: true,
      }),
      survey_id: Property.MultiSelectDropdown({
        auth: formBricksAuth,
        displayName: 'Survey',
        description:
          'A selection of surveys that will trigger. Else, all surveys will trigger.',
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

          const authValue = auth;

          const response = await httpClient.sendRequest<{ data: Survey[] }>({
            method: HttpMethod.GET,
            url: `${auth.props.appUrl}/api/v1/management/surveys`,
            headers: {
              'x-api-key': auth.props.apiKey,
            },
          });

          try {
            return {
              disabled: false,
              options: response.body.data.map((survey) => {
                return {
                  label: survey.name,
                  value: survey.id,
                };
              }),
            };
          } catch (error) {
            return {
              options: [],
              disabled: true,
              placeholder: `Couldn't load Surveys:\n${error}`,
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
        url: `${context.auth.props.appUrl}/api/v1/webhooks`,
        body: {
          name: `Activepieces ${name} trigger`,
          workspaceId : context.propsValue.organization_id, // formbricks docs dont have this field but it is required in the API
          url: context.webhookUrl,
          triggers: [eventType],
          surveyIds: context.propsValue.survey_id ?? [],
        },
        headers: {
          'x-api-key': context.auth.props.apiKey,
        },
      });
      await context.store.put<WebhookInformation>(
        `formbricks_${name}_trigger`,
        response.body
      );
    },
    async onDisable(context) {
      const webhook = await context.store.get<WebhookInformation>(
        `formbricks_${name}_trigger`
      );
      if (webhook?.data.id != null) {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `${context.auth.props.appUrl}/api/v1/webhooks/${webhook.data.id}`,
          headers: {
            'x-api-key': context.auth.props.apiKey,
          },
        };
        await httpClient.sendRequest(request);
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });

interface Survey {
  id: string;
  name: string;
}

interface WebhookInformation {
  data: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    url: string;
    source: string;
    environmentId: string;
    triggers: Array<string>;
    surveyIds: Array<string>;
  };
}
