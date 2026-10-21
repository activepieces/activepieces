import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventWebhook } from '../common/webhook';
import { tarventOutputSchemas } from '../output-schemas';

export const contactRepliedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_contact_replied',
  classification: 'READ',
  displayName: 'Contact Replied',
  description: 'Triggers when a contact replies.',
  aiMetadata: {
    description: 'Fires when a contact replies to a campaign or transactional email. Retried deliveries with the same event ID are ignored. Represents an inbound reply from a recipient.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: tarventOutputSchemas.emailEvent,
  props: {
    include: tarventCommon.include,
    entity: tarventCommon.entity,
    audienceId: tarventCommon.audienceId(false, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    groupId: tarventCommon.audienceGroupId(false, 'If specified, the trigger will only fire if contact is in the selected group.'),
    tagId: tarventCommon.tagId(false, 'If specified, the trigger will only fire if contact has the selected tag.')
  },
  ...tarventWebhook.handlers({ type: 'contactReplied', storeKey: 'tarvent_contact_replied' }),
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
        id: '000000000000000000',
        key: 'Kayla@tarvent.com',
        email: 'Kayla@tarvent.com',
        status: 1,
        rating: 3,
        firstName: 'Kayla',
        lastName: 'Johnson',
        streetAddress: '165 Caprice Court',
        streetAddress2: 'Suite A',
        addressLocality: 'Castle Rock',
        addressRegion: 'Colorado',
        postalCode: '80109',
        addressCountry: 'United States',
        latitude: 39.38363820960583,
        longitude: -104.86229586128452,
        timeZone: 'Mountain Standard Time',
        language: 'en',
        sendFormat: 1,
        optInUtc: '2022-08-28T17:37:26.6236851Z',
        optInSource: 6,
        optInIp: '0.0.0.0',
        confirmedUtc: '2022-08-29T17:37:26.6236972Z',
        confirmedIp: '0.0.0.0',
        optOutUtc: null,
        optOutSource: null,
        optOutIp: null,
        optOutReason: '',
        groups: ['359949389556096655', '359949389556097786'],
        tags: ['TarventTest', 'TarventTest2', 'TarventTest3'],
        profileFields: null,
        createdUtc: '2022-08-28T17:37:26.6237782Z',
        modifiedUtc: '2022-09-17T17:37:26.6237797Z',
      },
    },
  }
});
