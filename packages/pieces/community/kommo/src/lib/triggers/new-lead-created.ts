import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newLeadCreatedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'new_lead_created',
  displayName: 'New Lead Created',
  description: 'Triggers when a new lead is created.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const { subdomain, apiToken } = context.auth;

    const webhook = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.POST,
      `/webhooks`,
      {
        destination: context.webhookUrl,
        settings: ['add_lead']
      }
    );

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const { subdomain, apiToken } = context.auth;
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(
        { subdomain, apiToken },
        HttpMethod.DELETE,
               `/webhooks`,
        {destination:context.webhookUrl}
      );
    }
  },

  async run(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const payload = context.payload.body as { leads: { add: { id: string }[] } }
    const leadId = payload.leads.add[0].id;
    if (!leadId) return [];


    const response = await makeRequest({ apiToken, subdomain }, HttpMethod.GET, `/leads/${leadId}`)
    return [response]
  },
  async test(context) {
    const { subdomain, apiToken } = context.auth;

    const response = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/leads?limit=5&order[updated_at]=desc');

    const leads = response?._embedded?.leads ?? [];

    return leads;
  },
  sampleData: {
    "id": 256988,
    "name": "John Doe",
    "price": 100,
    "responsible_user_id": 13290567,
    "group_id": 0,
    "status_id": 86521115,
    "pipeline_id": 11273979,
    "loss_reason_id": null,
    "created_by": 13290567,
    "updated_by": 13290567,
    "created_at": 1748800059,
    "updated_at": 1748800060,
    "closed_at": null,
    "closest_task_at": null,
    "is_deleted": false,
    "custom_fields_values": null,
    "score": null,
    "account_id": 34678947,
    "labor_cost": null,
    "is_price_computed": false,
    "_links": {
      "self": {
        "href": ""
      }
    },
    "_embedded": {
      "tags": [],
      "companies": [
        {
          "id": 722828,
          "_links": {
            "self": {
              "href": ""
            }
          }
        }
      ]
    }
  }
});
