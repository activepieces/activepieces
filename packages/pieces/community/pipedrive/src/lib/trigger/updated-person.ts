import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { pipedriveCommon } from '../common';
import { pipedriveAuth } from '../..';

export const updatedPerson = createTrigger({
  auth: pipedriveAuth,
  name: 'updated_person',
  displayName: 'Updated Person',
  description: 'Triggers when a person is updated',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await pipedriveCommon.subscribeWebhook(
      'person',
      'updated',
      context.webhookUrl!,
      context.auth.data['api_domain'],
      context.auth.access_token
    );
    await context.store?.put<WebhookInformation>('_updated_person_trigger', {
      webhookId: webhook.data.id,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_updated_person_trigger'
    );
    if (response !== null && response !== undefined) {
      const webhook = await pipedriveCommon.unsubscribeWebhook(
        response.webhookId,
        context.auth.data['api_domain'],
        context.auth.access_token
      );
    }
  },
  async run(context) {
    // Pipedrive will always return a list of Persons even if we are looking up a specific person
    const payloadBody = context.payload.body as PayloadBody;
    return [payloadBody.current];
  },
  sampleData: {
    id: 1,
    company_id: 12,
    owner_id: {
      id: 123,
      name: 'Jane Doe',
      email: 'jane@pipedrive.com',
      has_pic: 1,
      pic_hash: '2611ace8ac6a3afe2f69ed56f9e08c6b',
      active_flag: true,
      value: 123,
    },
    org_id: {
      name: 'Org Name',
      people_count: 1,
      owner_id: 123,
      address: 'Mustamäe tee 3a, 10615 Tallinn',
      active_flag: true,
      cc_email: 'org@pipedrivemail.com',
      value: 1234,
    },
    name: 'Will Smith',
    first_name: 'Will',
    last_name: 'Smith',
    open_deals_count: 2,
    related_open_deals_count: 2,
    closed_deals_count: 3,
    related_closed_deals_count: 3,
    participant_open_deals_count: 1,
    participant_closed_deals_count: 1,
    email_messages_count: 1,
    activities_count: 1,
    done_activities_count: 1,
    undone_activities_count: 2,
    files_count: 2,
    notes_count: 2,
    followers_count: 3,
    won_deals_count: 3,
    related_won_deals_count: 3,
    lost_deals_count: 1,
    related_lost_deals_count: 1,
    active_flag: true,
    phone: [
      {
        value: '12345',
        primary: true,
        label: 'work',
      },
    ],
    email: [
      {
        value: '12345@email.com',
        primary: true,
        label: 'work',
      },
    ],
    primary_email: '12345@email.com',
    first_char: 'w',
    update_time: '2020-05-08 05:30:20',
    add_time: '2017-10-18 13:23:07',
    visible_to: '3',
    marketing_status: 'no_consent',
    picture_id: {
      item_type: 'person',
      item_id: 25,
      active_flag: true,
      add_time: '2020-09-08 08:17:52',
      update_time: '0000-00-00 00:00:00',
      added_by_user_id: 967055,
      pictures: {
        '128':
          'https://pipedrive-profile-pics.s3.example.com/f8893852574273f2747bf6ef09d11cfb4ac8f269_128.jpg',
        '512':
          'https://pipedrive-profile-pics.s3.example.com/f8893852574273f2747bf6ef09d11cfb4ac8f269_512.jpg',
      },
      value: 4,
    },
    next_activity_date: '2019-11-29',
    next_activity_time: '11:30:00',
    next_activity_id: 128,
    last_activity_id: 34,
    last_activity_date: '2019-11-28',
    last_incoming_mail_time: '2019-05-29 18:21:42',
    last_outgoing_mail_time: '2019-05-30 03:45:35',
    label: 1,
    org_name: 'Organization name',
    owner_name: 'Jane Doe',
    cc_email: 'org@pipedrivemail.com',
  },
});

interface WebhookInformation {
  webhookId: string;
}

type PayloadBody = {
  current: unknown;
};
