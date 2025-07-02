import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newContactAddedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'new_contact_added',
  displayName: 'New Contact Added',
  description: 'Triggers when a new contact is added.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const webhook = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.POST,
      `/webhooks`,
      {
        destination: context.webhookUrl,
        settings: ['add_contact']
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

    const payload = context.payload.body as { contacts: { add: { id: string }[] } }
    const contactId = payload.contacts.add[0].id;
    if (!contactId) return [];


    const response = await makeRequest({ apiToken, subdomain }, HttpMethod.GET, `/contacts/${contactId}`)
    return [response]
  },
  async test(context) {
    const { subdomain, apiToken } = context.auth;

    const response = await makeRequest({ subdomain, apiToken }, HttpMethod.GET, '/contacts?limit=5&order[updated_at]=desc');

    const contacts = response?._embedded?.contacts ?? [];

    return contacts;
  },
  sampleData: {
    "id": 722830,
    "name": "John Doe",
    "first_name": "",
    "last_name": "",
    "responsible_user_id": 13290567,
    "group_id": 0,
    "created_by": 13290567,
    "updated_by": 13290567,
    "created_at": 1748800060,
    "updated_at": 1748800060,
    "closest_task_at": null,
    "is_deleted": false,
    "is_unsorted": false,
    "custom_fields_values": null,
    "account_id": 34678947,
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
