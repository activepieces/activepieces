import { HttpRequest, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

const triggerNameInStore = 'event_on_data_trigger';
export const eventOnData = createTrigger({
  auth: kizeoFormsAuth,
  name: 'event_on_data',
  displayName: 'Event On Data',
  description: 'Handle EventOnData events via webhooks',
  props: {
    formId: kizeoFormsCommon.formId,
    event1:
      Property.StaticDropdown({
        displayName: "Events",
        description: "Which events will trigger this hook",
        required: true,
        options: {
          options: [
            {
              label: 'Data Deleted',
              value: 'delete',
            },
            {
              label: 'Data Saved',
              value: 'finished',
            },
            {
              label: 'Data Updated',
              value: 'update',
            },
            {
              label: 'Push Received',
              value: 'pull',
            },
            {
              label: 'Push Send',
              value: 'push',
            },
          ]
        }
      }),
    event2:
      Property.StaticDropdown({
        displayName: "Events",
        description: "Which events will trigger this hook",
        required: false,
        options: {
          options: [
            {
              label: '',
              value: '',
            },
            {
              label: 'Data Deleted',
              value: 'delete',
            },
            {
              label: 'Data Saved',
              value: 'finished',
            },
            {
              label: 'Data Updated',
              value: 'update',
            },
            {
              label: 'Push Received',
              value: 'pull',
            },
            {
              label: 'Push Send',
              value: 'push',
            },
          ]
        }
      }),
    event3:
      Property.StaticDropdown({
        displayName: "Events",
        description: "Which events will trigger this hook",
        required: false,
        options: {
          options: [
            {
              label: '',
              value: '',
            },
            {
              label: 'Data Deleted',
              value: 'delete',
            },
            {
              label: 'Data Saved',
              value: 'finished',
            },
            {
              label: 'Data Updated',
              value: 'update',
            },
            {
              label: 'Push Received',
              value: 'pull',
            },
            {
              label: 'Push Send',
              value: 'push',
            },
          ]
        }
      }),
    event4:
      Property.StaticDropdown({
        displayName: "Events",
        description: "Which events will trigger this hook",
        required: false,
        options: {
          options: [
            {
              label: '',
              value: '',
            },
            {
              label: 'Data Deleted',
              value: 'delete',
            },
            {
              label: 'Data Saved',
              value: 'finished',
            },
            {
              label: 'Data Updated',
              value: 'update',
            },
            {
              label: 'Push Received',
              value: 'pull',
            },
            {
              label: 'Push Send',
              value: 'push',
            },
          ]
        }
      }),
    event5:
      Property.StaticDropdown({
        displayName: "Events",
        description: "Which events will trigger this hook",
        required: false,
        options: {
          options: [
            {
              label: '',
              value: '',
            },
            {
              label: 'Data Deleted',
              value: 'delete',
            },
            {
              label: 'Data Saved',
              value: 'finished',
            },
            {
              label: 'Data Updated',
              value: 'update',
            },
            {
              label: 'Push Received',
              value: 'pull',
            },
            {
              label: 'Push Send',
              value: 'push',
            },
          ]
        }
      }),
  },
  sampleData: {
    "id": "1",
    "eventType": "[finished, pull]",
    "data": {
      "format": "4",
      "answer_time": "2023-04-11T13:59:23+02:00",
      "update_answer_time": "2023-04-11T13:59:23+02:00",
      "id_tel": "web2",
      "form_id": "1",
      "origin": "web",
      "app_version": "webapp",
      "media": [],
      "fields": {},
      "id": "1",
      "user_id": "1",
      "recipient_id": "1",
      "parent_data_id": null
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { formId, event1, event2, event3, event4, event5 } = context.propsValue;
    const onEvents = [event1, event2 !== '' ? event2 : null, event3 !== '' ? event3 : null, event4 !== '' ? event4 : null, event5 !== '' ? event5 : null].filter(Boolean);
    const webhookUrl = context.webhookUrl;
    // eslint-disable-next-line no-useless-escape
    const match = webhookUrl.match(/\/webhooks\/([^\/]+)/);
    let workflowId = "FlowId"
    if (match) {
      workflowId = match[1];
    }
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: endpoint + `public/v4/forms/${formId}/third_party_webhooks?used-with-actives-pieces=`,
      body: {
        'on_events': onEvents,
        'url': webhookUrl,
        'http_verb': 'POST',
        'body_content_choice': 'json_v4',
        'third_party': 'ActivePieces ',
        'third_party_id': workflowId,
      },
      headers: {
        'Authorization': context.auth
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
    const response = await context.store?.get<KizeoFormsWebhookInformation>(triggerNameInStore);
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: endpoint + `public/v4/forms/${formId}/third_party_webhooks/${response.webhookId}?used-with-actives-pieces=`,
        headers: {
          'Authorization': context.auth
        },
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    if (!context.payload.body) {
      return []
    }
    return [context.payload.body];
  },
});



interface KizeoFormsWebhookInformation {
  webhookId: string;
}
