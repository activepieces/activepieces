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
import { FormBricksAuthType, formBricksAuth } from '../..';

export const formBricksRegisterTrigger = ({
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
    auth: formBricksAuth,
    name: `formbricks_trigger_${name}`,
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

          const response = await httpClient.sendRequest<{ data: Survey[] }>({
            method: HttpMethod.GET,
            url: `${(auth as FormBricksAuthType).appUrl}/api/v1/management/surveys`,
            headers: {
              'x-Api-Key': auth as unknown as string,
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
        url: `${context.auth.appUrl}/api/v1/webhooks`,
        body: {
          url: context.webhookUrl,
          triggers: [eventType],
          surveyIds: context.propsValue.survey_id ?? [],
        },
        headers: {
          'x-Api-Key': context.auth as unknown as string,
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
      if (webhook != null) {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `${context.auth.appUrl}/api/v1/webhooks/${webhook.webhookId}`,
          headers: {
            'x-Api-Key': context.auth as unknown as string,
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
  webhookId: string;
  event: string;
  data: {
    id: string;
    createdAt: string;
    updatedAt: string;
    surveyId: string;
    finished: boolean;
    data: Record<string, string>;
    meta: Record<string, unknown>;
    personAttributes: Record<string, string>;
    person: {
      id: string;
      attributes: Record<string, string>;
      createdAt: string;
      updatedAt: string;
    };
    notes: [];
    tags: [];
  };
}

interface Survey {
  id: string;
  name: string;
}
