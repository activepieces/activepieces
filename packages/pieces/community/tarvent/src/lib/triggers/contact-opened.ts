import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventWebhook } from '../common/webhook';
import { tarventOutputSchemas } from '../output-schemas';

export const contactOpenedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_contact_opened',
  classification: 'READ',
  displayName: 'Campaign Or Transactional Email Opened',
  description: 'Triggers when a campaign or transactional email is opened by a recipient.',
  aiMetadata: {
    description: 'Fires when a recipient opens a campaign or transactional email. Can be scoped by entity (campaign vs. transactional), by which campaign(s) qualify (any/all of the last 5, any within a recent window, or a specific campaign), and optionally by audience, group, or tag. Retried deliveries with the same event ID are ignored. Represents an open engagement event.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: tarventOutputSchemas.emailEvent,
  props: {
    include: tarventCommon.include,
    entity: tarventCommon.entity,
    campaignType: Property.StaticDropdown({
      displayName: 'Campaign',
      description: 'Select what campaign(s) should fire the trigger.',
      required: true,
      defaultValue: 'BOTH',
      options: {
        options: [
          {
            label: 'Any campaign',
            value: 'BOTH',
          },
          {
            label: 'Any of the last 5 campaigns',

            value: 'Any',
          },
          {
            label: 'All of the last 5 campaigns',

            value: 'All',
          },
          {
            label: 'Any campaigns within last...',
            value: 'AnyX',
          },
          {
            label: 'A specific campaign',
            value: 'Specific',
          },
        ],
      },
    }),
    campaignScope: tarventCommon.campaignScope,
    campaignId: tarventCommon.campaignId(false, 'Only used if campaign type is set to "Specific"', false, true),
    audienceId: tarventCommon.audienceId(false, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    groupId: tarventCommon.audienceGroupId(false, 'If specified, the trigger will only fire if contact is in the selected group.'),
    tagId: tarventCommon.tagId(false, 'If specified, the trigger will only fire if contact has the selected tag.')
  },
  ...tarventWebhook.handlers({ type: 'contactOpened', storeKey: 'tarvent_contact_opened' }),
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
