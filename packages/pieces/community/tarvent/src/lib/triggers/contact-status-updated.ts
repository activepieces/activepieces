import { tarventAuth } from '../..';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient, tarventCommon } from '../common';
import { CreateWebhookResponse } from '../common/types';

export const contactStatusUpdatedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_contact_status_updated',
  displayName: 'Contact Status Changed',
  description: 'Triggers when a contact\'s status changes.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    include: tarventCommon.include,
    status: Property.StaticDropdown({
      displayName: 'Select what status should fire this trigger.',
      description: 'If not included, only the contact ID, email and unique identifier will be passed back.',
      required: true,
      defaultValue: 'Any',
      options: {
        options: [
          {
            label: 'Any',

            value: 'Any',
          },
          {
            label: 'Subscribe',
            value: 'ACTIVE',
          },
          {
            label: 'Unsubscribe',
            value: 'OPT_OUT',
          },
        ],
      },
    }),
    audienceId: tarventCommon.audienceId(false, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    groupId: tarventCommon.audienceGroupId(false, 'If specified, the trigger will only fire if contact is in the selected group.'),
    tagId: tarventCommon.tagId(false, 'If specified, the trigger will only fire if contact has the selected tag.')
  },
  async onEnable(context) {
    const client = makeClient(context.auth);
    const res = await client.createWebhook(context, 'contactStatusUpdated');
    await context.store.put<CreateWebhookResponse>('tarvent_contact_status_updated', res);
  },
  async run(context) {
    return [context.payload.body];
  },
  async onDisable(context) {
    const webhook = await context.store.get<CreateWebhookResponse>(
      'tarvent_contact_status_updated',
    );
    if (webhook != null) {
      const client = makeClient(context.auth);
      await client.deleteWebhook(webhook.data.createWebhook.id);
    }
  },
  sampleData: {
    "id": "000000000000000000",
    "dateUtc": "2022-09-27T17:37:26.482913Z",
    "accountId": "000000000000000000",
    "eventType": 1003,
    "initiator": {
      "source": 2,
      "ip": "0.0.0.0",
      "protocol": "IPv4",
      "httpVerb": "POST",
      "device": "Desktop",
      "software": "Outlook",
      "os": "Windows 11",
      "referrer": "https://gmail.com"
    },
    "payload": {
      "audienceId": "000000000000000000",
      "contact": {
        "id": "000000000000000000",
        "key": "Kayla@tarvent.com",
        "email": "Kayla@tarvent.com",
        "status": 1,
        "rating": 3,
        "firstName": "Kayla",
        "lastName": "Johnson",
        "streetAddress": "165 Caprice Court",
        "streetAddress2": "Suite A",
        "addressLocality": "Castle Rock",
        "addressRegion": "Colorado",
        "postalCode": "80109",
        "addressCountry": "United States",
        "latitude": 39.38363820960583,
        "longitude": -104.86229586128452,
        "timeZone": "Mountain Standard Time",
        "language": "en",
        "sendFormat": 1,
        "optInUtc": "2022-08-28T17:37:26.6236851Z",
        "optInSource": 6,
        "optInIp": "0.0.0.0",
        "confirmedUtc": "2022-08-29T17:37:26.6236972Z",
        "confirmedIp": "0.0.0.0",
        "optOutUtc": null,
        "optOutSource": null,
        "optOutIp": null,
        "optOutReason": "",
        "groups": [
          "359949389556096655",
          "359949389556097786"
        ],
        "tags": [
          "TarventTest",
          "TarventTest2",
          "TarventTest3"
        ],
        "profileFields": null,
        "createdUtc": "2022-08-28T17:37:26.6237782Z",
        "modifiedUtc": "2022-09-17T17:37:26.6237797Z"
      }
    }
  },
});
