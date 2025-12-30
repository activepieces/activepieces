import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { surveyTaleAuth, SURVEYTALE_BASE_URL } from '../..';

export const surveyTaleRegisterTrigger = ({
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
    auth: surveyTaleAuth,
    name: `surveytale_trigger_${name}`,
    displayName,
    description,
    props: {
      survey_id: Property.MultiSelectDropdown({
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

          const apiKey = auth as string;

          const response = await httpClient.sendRequest<{ data: Survey[] }>({
            method: HttpMethod.GET,
            url: `${SURVEYTALE_BASE_URL}/api/v1/management/surveys`,
            headers: {
              'x-api-key': apiKey,
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
      const apiKey = context.auth as string;
      const response = await httpClient.sendRequest<WebhookInformation>({
        method: HttpMethod.POST,
        url: `${SURVEYTALE_BASE_URL}/api/v1/webhooks`,
        body: {
          url: context.webhookUrl,
          triggers: [eventType],
          surveyIds: context.propsValue.survey_id ?? [],
        },
        headers: {
          'x-api-key': apiKey,
        },
      });
      await context.store.put<WebhookInformation>(
        `surveytale_${name}_trigger`,
        response.body
      );
    },
    async onDisable(context) {
      const apiKey = context.auth as string;
      const webhook = await context.store.get<WebhookInformation>(
        `surveytale_${name}_trigger`
      );
      if (webhook?.data.id != null) {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `${SURVEYTALE_BASE_URL}/api/v1/webhooks/${webhook.data.id}`,
          headers: {
            'x-api-key': apiKey,
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
