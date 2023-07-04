import { HttpRequest, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, TriggerStrategy , createTrigger} from "@activepieces/pieces-framework";
import { endpoint, kizeoFormsCommon } from '../common';

const triggerNameInStore = 'event_on_data_finished_trigger';
export const eventOnDataFinished = createTrigger({
  name: 'event_on_data_finished',
  displayName: 'Event On Data Finished',
  description: 'Handle EventOnData save event via webhooks',
  props: {
    authentication: kizeoFormsCommon.authentication,
    formId: kizeoFormsCommon.formId,
  },
  sampleData: {
    "id": "1",
    "eventType": "[finished]",
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
    const { authentication: personalToken, formId } = context.propsValue;
    const webhookUrl = context.webhookUrl;
    const match = webhookUrl.match(/\/webhooks\/(\w+)\//);
    let workflowId = ""
    if (match) {
      workflowId = match[1];
    }
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: endpoint + `public/v4/forms/${formId}/third_party_webhooks?used-with-actives-pieces=`,
      body: {
        'on_events': ['finished'],
				'url': webhookUrl,
				'http_verb': 'POST',
				'body_content_choice': 'json_v4',
        'third_party': 'Active Pieces ',
        'third_party_id': workflowId,
      },
      headers: {
        'Authorization': personalToken
      },
      queryParams: {},
    };
    const { body } = await httpClient.sendRequest<{ id: string }>(request);
    await context.store?.put<KizeoFormsWebhookInformation>(triggerNameInStore, {
      webhookId: body.id,
    });


  },
  async onDisable(context) {
    const { authentication: personalToken, formId} = context.propsValue;
    const response = await context.store?.get<KizeoFormsWebhookInformation>(triggerNameInStore);
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://forms.kizeo.com/rest/public/v4/forms/${formId}/third_party_webhooks/${response.webhookId}?used-with-actives-pieces=`,
        headers: {
          'Authorization': personalToken
        },
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});



interface KizeoFormsWebhookInformation {
  webhookId: string;
}
