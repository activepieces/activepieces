import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const scheduleCampaign = createAction({
  auth: mailchimpAuth,
  name: 'schedule_campaign',
  classification: 'WRITE',
  displayName: 'Schedule Campaign',
  description: 'Schedule a draft campaign to send at a set time. Requires a paid Mailchimp plan.',
  audience: 'both',
  aiMetadata: {
    description: 'Schedules a draft campaign (campaign_id) to send to its audience at a future time, which must be on a quarter hour (:00, :15, :30, :45) in UTC. Scheduling needs a paid Mailchimp plan; free accounts get an error. Not idempotent: scheduling an already scheduled campaign fails, unschedule it first.',
    idempotent: false,
  },
  outputSchema: mailchimpOutputSchemas['campaignAction'],
  props: {
    campaign_id: mailchimpCommon.mailChimpDraftCampaignIdDropdown,
    schedule_time: Property.DateTime({
      displayName: 'Send At',
      description: 'When to send, on a quarter hour (for example 14:15 UTC).',
      required: true,
    }),
    timewarp: Property.Checkbox({
      displayName: 'Timewarp',
      description: 'Deliver at this local time in each recipient time zone.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const rawTime = mailchimpApi.requireText({ value: context.propsValue.schedule_time, label: 'Send At' });
    const time = new Date(rawTime);
    if (Number.isNaN(time.getTime())) {
      throw new Error('Send At must be a valid date and time.');
    }
    if (time.getUTCMinutes() % 15 !== 0 || time.getUTCSeconds() !== 0) {
      throw new Error('Send At must be on a quarter hour (:00, :15, :30 or :45).');
    }
    if (time.getTime() <= Date.now()) {
      throw new Error('Send At must be in the future.');
    }
    const campaignId = mailchimpApi.requireText({ value: context.propsValue.campaign_id, label: 'Campaign' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = `/campaigns/${encodeURIComponent(campaignId)}`;
    const scheduleTime = time.toISOString();
    await client.request<unknown>({
      method: HttpMethod.POST,
      path: `${path}/actions/schedule`,
      body: { schedule_time: scheduleTime, timewarp: context.propsValue.timewarp === true },
      operation: 'schedule campaign',
    });
    return { success: true, campaign_id: campaignId, schedule_time: scheduleTime };
  },
});
