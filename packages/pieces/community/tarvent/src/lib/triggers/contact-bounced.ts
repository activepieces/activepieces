import { tarventAuth } from '../auth';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { tarventCommon } from '../common';
import { tarventWebhook } from '../common/webhook';
import { tarventOutputSchemas } from '../output-schemas';

export const contactBouncedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_contact_bounced',
  classification: 'READ',
  displayName: 'Campaign Or Transactional Email Bounced',
  description: 'Triggers when a campaign or transactional email bounces (is rejected) for a contact.',
  aiMetadata: {
    description: 'Fires when a campaign or transactional email bounces (is rejected) for a contact. Can be scoped by entity (campaign vs. transactional) and by bounce type (any, hard, soft, block, DNS failure, etc.), and optionally by audience, group, or tag. Retried deliveries with the same event ID are ignored. Represents a failed delivery.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: tarventOutputSchemas.bounceEvent,
  props: {
    include: tarventCommon.include,
    entity: tarventCommon.entity,
    type: Property.StaticDropdown({
      displayName: 'Bounce type',
      description: 'Select which bounce type should fire the trigger.',
      required: true,
      defaultValue: 'Any',
      options: {
        options: [
          { label: 'Any', value: 'Any' },
          { label: 'Block', value: 'BLOCK' },
          { label: 'Content block', value: 'BLOCK_CONTENT' },
          { label: 'Sender block', value: 'BLOCK_SENDER' },
          { label: 'Hard bounce', value: 'HARD' },
          { label: 'Soft bounce', value: 'SOFT' },
          { label: 'DNS failure', value: 'SOFT_DNS' },
          { label: 'IP Block', value: 'SOFT_IP' },
          { label: 'Sender authentication', value: 'SOFT_SENDER_AUTH' }
        ],
      },
    }),
    audienceId: tarventCommon.audienceId(false, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    groupId: tarventCommon.audienceGroupId(false, 'If specified, the trigger will only fire if contact is in the selected group.'),
    tagId: tarventCommon.tagId(false, 'If specified, the trigger will only fire if contact has the selected tag.')
  },
  ...tarventWebhook.handlers({ type: 'contactBounced', storeKey: 'tarvent_contact_bounced' }),
  sampleData: {
    id: '000000000000000000',
    dateUtc: '2022-09-27T17:37:26.482913Z',
    accountId: '000000000000000000',
    eventType: 1003,
    initiator: {
      source: 2,
      ip: '0.0.0.0',
      protocol: 'IPv4',
      httpVerb: 'POST',
      device: 'Desktop',
      software: 'Outlook',
      os: 'Windows 11',
      referrer: 'https://gmail.com',
    },
    payload: {
      emailId: '000000000000000000',
      bounce: {
        type: 100,
        response: 'smtp;550 5.1.1 The email account that you tried to reach does not exist.'
      },
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
      },
    },
  }
});
