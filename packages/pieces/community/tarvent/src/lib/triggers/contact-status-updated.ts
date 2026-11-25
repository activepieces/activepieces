import { tarventAuth } from '../auth';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { tarventCommon } from '../common';
import { tarventWebhook } from '../common/webhook';
import { tarventOutputSchemas } from '../output-schemas';

export const contactStatusUpdatedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_contact_status_updated',
  classification: 'READ',
  displayName: 'Contact Status Changed',
  description: 'Triggers when a contact\'s status changes.',
  aiMetadata: {
    description: 'Fires when a contact\'s subscription status changes, with a selectable status filter (any change, or specifically subscribe vs. unsubscribe). Retried deliveries with the same event ID are ignored. Represents a consent or lifecycle state transition.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: tarventOutputSchemas.contactEvent,
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
  ...tarventWebhook.handlers({ type: 'contactStatusUpdated', storeKey: 'tarvent_contact_status_updated' }),
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
