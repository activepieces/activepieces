import { tarventAuth } from '../..';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient, tarventCommon } from '../common';
import { CreateWebhookResponse } from '../common/types';

export const contactClickedTrigger = createTrigger({
  auth: tarventAuth,
  name: 'tarvent_contact_clicked',
  displayName: 'Campaign Or Transactional Link Clicked',
  description: 'Triggers when a link within a campaign or transactional email is clicked by a recipient.',
  type: TriggerStrategy.WEBHOOK,
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
    linkId: tarventCommon.campaignLinkId(false),
    audienceId: tarventCommon.audienceId(false, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    groupId: tarventCommon.audienceGroupId(false, 'If specified, the trigger will only fire if contact is in the selected group.'),
    tagId: tarventCommon.tagId(false, 'If specified, the trigger will only fire if contact has the selected tag.')
  },
  async onEnable(context) {
    const client = makeClient(context.auth);
    const res = await client.createWebhook(context, 'contactClicked');
    await context.store.put<CreateWebhookResponse>('tarvent_contact_clicked', res);
  },
  async run(context) {
    return [context.payload.body];
  },
  async onDisable(context) {
    const webhook = await context.store.get<CreateWebhookResponse>(
      'tarvent_contact_clicked',
    );
    if (webhook != null) {
      const client = makeClient(context.auth);
      await client.deleteWebhook(webhook.data.createWebhook.id);
    }
  },
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
      link: {
        id: '000000000000000000',
        url: 'https://yourdomain.com/yourpage'
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
