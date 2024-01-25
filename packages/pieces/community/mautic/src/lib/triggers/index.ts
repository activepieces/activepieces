import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { mauticAuth } from '../../index';
import { Property, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";

const contactTestData = {
  "contact": {
    "id": 38186,
    "points": 0,
    "color": null,
    "fields": {
      "core": {
        "points": {
          "id": "9",
          "label": "Points",
          "alias": "points",
          "type": "number",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": "0"
        },
        "title": {
          "id": "1",
          "label": "Title",
          "alias": "title",
          "type": "lookup",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "firstname": {
          "id": "2",
          "label": "First Name",
          "alias": "firstname",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": "Test"
        },
        "lastname": {
          "id": "3",
          "label": "Last Name",
          "alias": "lastname",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": "Contact"
        },
        "company": {
          "id": "4",
          "label": "Company",
          "alias": "company",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "position": {
          "id": "5",
          "label": "Position",
          "alias": "position",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "email": {
          "id": "6",
          "label": "Email",
          "alias": "email",
          "type": "email",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": "Test@email.com"
        },
        "phone": {
          "id": "8",
          "label": "Phone",
          "alias": "phone",
          "type": "tel",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "mobile": {
          "id": "7",
          "label": "Mobile",
          "alias": "mobile",
          "type": "tel",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "address1": {
          "id": "11",
          "label": "Address Line 1",
          "alias": "address1",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "address2": {
          "id": "12",
          "label": "Address Line 2",
          "alias": "address2",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "city": {
          "id": "13",
          "label": "City",
          "alias": "city",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "state": {
          "id": "14",
          "label": "State",
          "alias": "state",
          "type": "region",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "zipcode": {
          "id": "15",
          "label": "Zip Code",
          "alias": "zipcode",
          "type": "text",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "country": {
          "id": "16",
          "label": "Country",
          "alias": "country",
          "type": "country",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": ""
        },
        "fax": {
          "id": "10",
          "label": "Fax",
          "alias": "fax",
          "type": "tel",
          "group": "core",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "preferred_locale": {
          "id": "17",
          "label": "Preferred Locale",
          "alias": "preferred_locale",
          "type": "locale",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": null
        },
        "attribution_date": {
          "id": "18",
          "label": "Attribution Date",
          "alias": "attribution_date",
          "type": "datetime",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": null
        },
        "attribution": {
          "id": "19",
          "label": "Attribution",
          "alias": "attribution",
          "type": "number",
          "group": "core",
          "object": "lead",
          "is_fixed": "1",
          "value": null
        },
        "website": {
          "id": "20",
          "label": "Website",
          "alias": "website",
          "type": "url",
          "group": "core",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "boolean": {
          "id": "43",
          "label": "Boolean",
          "alias": "boolean",
          "type": "boolean",
          "group": "core",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "multiple_contact": {
          "id": "44",
          "label": "Multiple Contact",
          "alias": "multiple_contact",
          "type": "multiselect",
          "group": "core",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        }
      },
      "social": {
        "facebook": {
          "id": "21",
          "label": "Facebook",
          "alias": "facebook",
          "type": "text",
          "group": "social",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "foursquare": {
          "id": "22",
          "label": "Foursquare",
          "alias": "foursquare",
          "type": "text",
          "group": "social",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "instagram": {
          "id": "24",
          "label": "Instagram",
          "alias": "instagram",
          "type": "text",
          "group": "social",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "linkedin": {
          "id": "25",
          "label": "LinkedIn",
          "alias": "linkedin",
          "type": "text",
          "group": "social",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "skype": {
          "id": "26",
          "label": "Skype",
          "alias": "skype",
          "type": "text",
          "group": "social",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        },
        "twitter": {
          "id": "27",
          "label": "Twitter",
          "alias": "twitter",
          "type": "text",
          "group": "social",
          "object": "lead",
          "is_fixed": "0",
          "value": null
        }
      },
      "personal": [],
      "professional": []
    }
  },
  "channel": "email",
  "old_status": "contactable",
  "new_status": "manual",
  "timestamp": "2017-12-01T00:05:18-06:00"
}

export const triggers = [
  {
    name: "lead_post_save_update",
    displayName: "Contact Updated",
    description: "Triggers when a contact is updated.",
    sampleData: {
      "mautic.lead_post_save_update": [contactTestData]
    },
    eventType: "mautic.lead_post_save_update",
  },
  {
    name: "lead_company_change",
    displayName: "Contact Company Subscription Change",
    description: "Triggers when a commpany is added or removed to/from contact.",
    sampleData: {
      "mautic.lead_company_change": [contactTestData]
    },
    eventType: "mautic.lead_company_change",
  },
  {
    name: "lead_channel_subscription_changed",
    displayName: "Contact Channel Subscription Change",
    description: "Triggers when a contact's channel subscription status changes.",
    sampleData: {
      "mautic.lead_channel_subscription_changed": [contactTestData]
    },
    eventType: "mautic.lead_channel_subscription_changed",
  },
  {
    name: "lead_post_save_new",
    displayName: "New Contact",
    description: "Triggers when a new contact is created.",
    sampleData: {
      "mautic.lead_post_save_new": [contactTestData]
    },
    eventType: "mautic.lead_post_save_new",
  },
]
  .map((props) => registerTrigger(props));

function registerTrigger({
  name,
  displayName,
  eventType,
  description,
  sampleData
}: {
  name: string;
  displayName: string;
  eventType: string;
  description: string;
  sampleData: unknown;
}) {
  return createTrigger({
    auth: mauticAuth,
    name: `mautic_${name}_trigger`,
    displayName,
    description,
    props: {
      name: Property.ShortText({
        displayName: "Webhook Name",
        description: "The name the webhook will be searchable by in mautic the webhooks page.",
        required: true
      }),
      description: Property.LongText({
        displayName: "Description",
        description: "A short description of the webhook",
        required: true
      })
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const { base_url, username, password } = context.auth

      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${(base_url.endsWith('/') ? base_url : base_url + '/')}api/hooks/new`,
        body: {
          name: context.propsValue.name,
          description: context.propsValue.description,
          webhookUrl: context.webhookUrl,
          eventsOrderbyDir: "ASC",
          triggers: [eventType]
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization':
            'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        },
        queryParams: {},
      }

      const response = await httpClient.sendRequest<WebhookInformation>(request);
      await context.store.put<WebhookInformation>(`mautic_${name}_trigger`, response.body);
    },
    async onDisable(context) {
      const { base_url, username, password } = context.auth

      const webhook = await context.store.get<WebhookInformation>(`mautic_${name}_trigger`);
      if (webhook != null) {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `${(base_url.endsWith('/') ? base_url : base_url + '/')}api/hooks/${webhook.hook.id}/delete`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
              'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
          },
        };
        const response = await httpClient.sendRequest(request);
        console.debug(`mautic.trigger.onDisable`, response);
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });
}


interface WebhookInformation {
  hook: {
    isPublished: boolean
    dateAdded: string
    dateModified: string
    createdBy: number
    createdByUser: string
    modifiedBy: unknown | null
    modifiedByUser: string
    id: number
    name: string
    description: string
    webhookUrl: string
    secret: string
    eventsOrderbyDir: string
    category: {
      id: number
      createdByUser: string
      modifiedByUser: string
      title: string
      alias: string
      description: string | null
      color: string | null
      bundle: string
    }
    triggers: string[]
  }
}
