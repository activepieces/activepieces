import { tarventAuth } from '../auth';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { tarventCommon } from '../common';
import { tarventWebhook } from '../common/webhook';
import { tarventOutputSchemas } from '../output-schemas';

export const contactTagUpdatedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_contact_tag_updated',
  classification: 'READ',
  displayName: 'Contact Tag Added Or Removed',
  description: 'Triggers when a tag is added or removed from a contact.',
  aiMetadata: {
    description: 'Fires when a tag is added to or removed from a contact, with the direction (added vs. removed) selectable. Retried deliveries with the same event ID are ignored. Represents a change in a contact\'s tags.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: tarventOutputSchemas.contactEvent,
  props: {
    include: tarventCommon.include,
    action: Property.StaticDropdown({
      displayName: 'Tag action',
      description: 'Select if the trigger should fire when a tag is added or removed.',
      required: true,
      defaultValue: 'Add',
      options: {
        options: [
          {
            label: 'Added',

            value: 'Add',
          },
          {
            label: 'Removed',
            value: 'Remove',
          }
        ],
      },
    }),
    audienceId: tarventCommon.audienceId(false, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    groupId: tarventCommon.audienceGroupId(false, 'If specified, the trigger will only fire if contact is in the selected group.'),
    tagId: tarventCommon.tagId(false, 'If specified, the trigger will only fire if contact has the selected tag.')
  },
  ...tarventWebhook.handlers({ type: 'contactTagUpdated', storeKey: 'tarvent_contact_tag_updated' }),
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
      contact: {
        id: '1594408175877314400',
        email: 'aptest+4@example.com',
        key: 'aptest+4@example.com',
        status: '1',
        rating: '',
        firstname: 'ApTest',
        lastname: 'Example',
        streetaddress: '',
        streetaddress2: '',
        addresslocality: '',
        addressregion: '',
        postalcode: '',
        addresscountry: '',
        longitude: '',
        latitude: '',
        language: '',
        timezone: '',
        sendformat: '1',
        optinsource: '6',
        optinip: '',
        optinutc: '10/21/2026 20:44:25',
        confirmedutc: '',
        confirmedip: '',
        createdutc: '10/21/2026 20:44:25',
        modifiedutc: '10/21/2026 20:44:25',
        groups: '[]',
        tags: '[]',
      }
    }
  },
});
