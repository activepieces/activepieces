import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const mailChimpNewSegmentTagSubscriberTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_segment_tag_subscriber',
  displayName: 'New Segment Tag Subscriber',
  description: 'Fires when a subscriber joins a specific segment/tag.',
  type: TriggerStrategy.POLLING,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The tag name to monitor for new subscribers',
      required: true,
    }),
  },
  sampleData: {
    id: 'subscriber123',
    email_address: 'user@example.com',
    unique_email_id: 'unique123',
    web_id: 123456,
    email_type: 'html',
    status: 'subscribed',
    merge_fields: {
      FNAME: 'John',
      LNAME: 'Doe',
      EMAIL: 'user@example.com',
    },
    interests: {},
    stats: {
      avg_open_rate: 0.25,
      avg_click_rate: 0.05,
    },
    ip_signup: '192.168.1.1',
    timestamp_signup: '2009-03-26T21:35:57+00:00',
    ip_opt: '192.168.1.1',
    timestamp_opt: '2009-03-26T21:35:57+00:00',
    member_rating: 3,
    last_changed: '2009-03-26T21:35:57+00:00',
    language: 'en',
    vip: false,
    email_client: 'Gmail',
    location: {
      latitude: 0,
      longitude: 0,
      gmtoff: 0,
      dstoff: 0,
      country_code: 'US',
      timezone: 'America/New_York',
    },
    tags: [
      {
        id: 123,
        name: 'VIP',
      },
    ],
  },

  async onEnable(context): Promise<void> {
    await context.store?.put('last_check', new Date().toISOString());
  },

  async onDisable(context): Promise<void> {
    await context.store?.delete('last_check');
  },

  async run(context): Promise<unknown[]> {
    const lastCheck = await context.store?.get<string>('last_check');
    const listId = context.propsValue.list_id!;
    const tagName = context.propsValue.tag_name!;

    try {
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/lists/${listId}/members?tags=${encodeURIComponent(tagName)}&since_last_changed=${lastCheck || ''}`
      );

      const members = response.body.members || [];
      const newTaggedMembers = members.filter((member: any) => 
        member.tags.some((tag: any) => tag.name === tagName)
      );

      await context.store?.put('last_check', new Date().toISOString());

      return newTaggedMembers;
    } catch (error) {
      console.error('Error fetching tagged members:', error);
      return [];
    }
  },
});
