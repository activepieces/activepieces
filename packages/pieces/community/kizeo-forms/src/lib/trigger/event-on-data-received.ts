import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

const triggerNameInStore = 'event_on_data_received_trigger';
export const eventOnDataPulled = createTrigger({
  auth: kizeoFormsAuth,
  name: 'event_on_data_received',
  displayName: 'Event On Data Received',
  description: 'Handle EventOnData receive event via webhooks',
  props: {
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Select the output format',
      required: true,
      defaultValue: 'simple',
      options: {
        options: [
          {
            label: 'Simple format',
            value: 'simple',
          },
          {
            label: 'Advanced format',
            value: 'advanced',
          },
        ],
      },
    }),
    formId: kizeoFormsCommon.formId,
  },
  sampleData: {
    id: '1',
    eventType: '[pull]',
    data: {
      format: '4',
      answer_time: '2023-04-11T13:59:23+02:00',
      update_answer_time: '2023-04-11T13:59:23+02:00',
      id_tel: 'web2',
      form_id: '1',
      origin: 'web',
      app_version: 'webapp',
      media: [],
      fields: {},
      id: '1',
      user_id: '1',
      recipient_id: '1',
      parent_data_id: null,
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { formId } = context.propsValue;
    const webhookUrl = context.webhookUrl;
    // eslint-disable-next-line no-useless-escape
    const match = webhookUrl.match(/\/webhooks\/([^\/]+)/);
    let workflowId = 'FlowId';
    if (match) {
      workflowId = match[1];
    }
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url:
        endpoint +
        `public/v4/forms/${formId}/third_party_webhooks?used-with-actives-pieces=`,
      body: {
        on_events: ['pull'],
        url: webhookUrl,
        http_verb: 'POST',
        body_content_choice: 'json_v4',
        third_party: 'ActivePieces ',
        third_party_id: workflowId,
      },
      headers: {
        Authorization: context.auth,
      },
      queryParams: {},
    };
    const { body } = await httpClient.sendRequest<{ id: string }>(request);
    await context.store?.put<KizeoFormsWebhookInformation>(triggerNameInStore, {
      webhookId: body.id,
    });
  },
  async onDisable(context) {
    const { formId } = context.propsValue;
    const response = await context.store?.get<KizeoFormsWebhookInformation>(
      triggerNameInStore
    );
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url:
          endpoint +
          `public/v4/forms/${formId}/third_party_webhooks/${response.webhookId}?used-with-actives-pieces=`,
        headers: {
          Authorization: context.auth,
        },
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    if (!context.payload.body) {
      return [];
    }
    const body = context.payload.body as BodyDataType;
    const formattedData: FormattedData = {
      id: body.id,
    };
    if (context.propsValue.format === 'simple') {
      for (const fieldKey in body.data.fields) {
        if (
          body.data.fields[fieldKey].result &&
          body.data.fields[fieldKey].result?.value !== undefined
        ) {
          const newFieldKey = fieldKey;
          formattedData[newFieldKey] = body.data.fields[fieldKey].result?.value;
        }
      }
      return [formattedData];
    }

    return [body];
  },
});

interface FormattedData {
  id: string;
  [key: string]: any;
}

interface BodyDataType {
  id: string;
  data: {
    fields: {
      [key: string]: {
        result?: {
          value: any;
        };
      };
    };
  };
}

interface KizeoFormsWebhookInformation {
  webhookId: string;
}
