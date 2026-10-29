import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventWebhook } from '../common/webhook';
import { tarventOutputSchemas } from '../output-schemas';

export const transactionCreatedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_transaction_created',
  classification: 'READ',
  displayName: 'Transaction Created',
  description: 'Triggers when a transactional email is created for a known or unknown contact.',
  aiMetadata: {
    description: 'Fires when a transactional email is created (queued) for a known or unknown contact, before it is sent. Retried deliveries with the same event ID are ignored. Represents a newly initiated transactional message.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: tarventOutputSchemas.emailEvent,
  props: {
    include: tarventCommon.include,
    audienceId: tarventCommon.audienceId(false, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    groupId: tarventCommon.audienceGroupId(false, 'If specified, the trigger will only fire if contact is in the selected group.'),
    tagId: tarventCommon.tagId(false, 'If specified, the trigger will only fire if contact has the selected tag.')
  },
  ...tarventWebhook.handlers({ type: 'transactionCreated', storeKey: 'tarvent_transaction_created' }),
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
      "emailId": "000000000000000000",
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
