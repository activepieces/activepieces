import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const createCampaignAction = createAction({
  auth: instantlyAiAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new cold email campaign in Instantly',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'Name of the campaign',
      required: true,
    }),
    schedule_time_from: Property.ShortText({
      displayName: 'Schedule Time From',
      description: 'Start time in 24-hour format (e.g., "09:00")',
      required: true,
      defaultValue: '09:00',
    }),
    schedule_time_to: Property.ShortText({
      displayName: 'Schedule Time To',
      description: 'End time in 24-hour format (e.g., "17:00")',
      required: true,
      defaultValue: '17:00',
    }),
    schedule_timezone: Property.ShortText({
      displayName: 'Schedule Timezone',
      description: 'Timezone for the schedule i.e. "America/Dawson".',
      required: true,
    }),
    weekday_sending: Property.Checkbox({
      displayName: 'Send on Weekdays',
      description: 'Whether to send emails Monday-Friday',
      required: false,
      defaultValue: true,
    }),
    weekend_sending: Property.Checkbox({
      displayName: 'Send on Weekends',
      description: 'Whether to send emails Saturday-Sunday',
      required: false,
      defaultValue: false,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'Date to start the campaign',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'Date to end the campaign',
      required: false,
    }),
    pl_value: Property.Number({
      displayName: 'Positive Lead Value',
      description: 'Value of every positive lead',
      required: false,
    }),
    is_evergreen: Property.Checkbox({
      displayName: 'Is Evergreen',
      description: 'Whether the campaign is evergreen',
      required: false,
    }),
    email_gap: Property.Number({
      displayName: 'Email Gap',
      description: 'Gap between emails in minutes',
      required: false,
    }),
    random_wait_max: Property.Number({
      displayName: 'Maximum Random Wait Time',
      description: 'Maximum random wait time in minutes',
      required: false,
    }),
    text_only: Property.Checkbox({
      displayName: 'Text Only',
      description: 'Whether the campaign is text-only',
      required: false,
    }),
    daily_limit: Property.Number({
      displayName: 'Daily Limit',
      description: 'Daily limit for sending emails',
      required: false,
    }),
    stop_on_reply: Property.Checkbox({
      displayName: 'Stop on Reply',
      description: 'Whether to stop campaign on reply',
      required: false,
    }),
    link_tracking: Property.Checkbox({
      displayName: 'Link Tracking',
      description: 'Whether to track links in emails',
      required: false,
    }),
    open_tracking: Property.Checkbox({
      displayName: 'Open Tracking',
      description: 'Whether to track opens in emails',
      required: false,
    }),
    stop_on_auto_reply: Property.Checkbox({
      displayName: 'Stop on Auto Reply',
      description: 'Whether to stop campaign on auto-reply',
      required: false,
    }),
    daily_max_leads: Property.Number({
      displayName: 'Daily Maximum Leads',
      description: 'Maximum daily new leads to contact',
      required: false,
    }),
    prioritize_new_leads: Property.Checkbox({
      displayName: 'Prioritize New Leads',
      description: 'Whether to prioritize new leads',
      required: false,
    }),
    match_lead_esp: Property.Checkbox({
      displayName: 'Match Lead ESP',
      description: 'Whether to match leads by ESP',
      required: false,
    }),
    stop_for_company: Property.Checkbox({
      displayName: 'Stop for Company',
      description: 'Stop campaign for the company (domain) when a lead replies',
      required: false,
    }),
    insert_unsubscribe_header: Property.Checkbox({
      displayName: 'Insert Unsubscribe Header',
      description: 'Insert unsubscribe header in emails',
      required: false,
    }),
    allow_risky_contacts: Property.Checkbox({
      displayName: 'Allow Risky Contacts',
      description: 'Allow risky contacts',
      required: false,
    }),
    disable_bounce_protect: Property.Checkbox({
      displayName: 'Disable Bounce Protection',
      description: 'Disable bounce protection',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      schedule_time_from,
      schedule_time_to,
      schedule_timezone,
      weekday_sending,
      weekend_sending,
      start_date,
      end_date,
      pl_value,
      is_evergreen,
      email_gap,
      random_wait_max,
      text_only,
      daily_limit,
      stop_on_reply,
      link_tracking,
      open_tracking,
      stop_on_auto_reply,
      daily_max_leads,
      prioritize_new_leads,
      match_lead_esp,
      stop_for_company,
      insert_unsubscribe_header,
      allow_risky_contacts,
      disable_bounce_protect,
    } = context.propsValue;
    const { auth: apiKey } = context;

    // Build the campaign schedule according to API requirements
    const campaignSchedule: Record<string, any> = {
      schedules: [
        {
          name: "Default Schedule",
          timing: {
            from: schedule_time_from,
            to: schedule_time_to,
          },
          days: {
            0: weekday_sending, // Monday
            1: weekday_sending, // Tuesday
            2: weekday_sending, // Wednesday
            3: weekday_sending, // Thursday
            4: weekday_sending, // Friday
            5: weekend_sending, // Saturday
            6: weekend_sending, // Sunday
          },
          timezone: schedule_timezone,
        }
      ],
    };

    // Add optional start and end dates if provided
    if (start_date) {
      campaignSchedule['start_date'] = start_date;
    }

    if (end_date) {
      campaignSchedule['end_date'] = end_date;
    }

    // Build the payload with required fields
    const payload: Record<string, unknown> = {
      name,
      campaign_schedule: campaignSchedule,
    };

    // Add optional fields if provided
    if (pl_value !== undefined) {
      payload['pl_value'] = pl_value;
    }

    if (is_evergreen !== undefined) {
      payload['is_evergreen'] = is_evergreen;
    }

    if (email_gap !== undefined) {
      payload['email_gap'] = email_gap;
    }

    if (random_wait_max !== undefined) {
      payload['random_wait_max'] = random_wait_max;
    }

    if (text_only !== undefined) {
      payload['text_only'] = text_only;
    }

    if (daily_limit !== undefined) {
      payload['daily_limit'] = daily_limit;
    }

    if (stop_on_reply !== undefined) {
      payload['stop_on_reply'] = stop_on_reply;
    }

    if (link_tracking !== undefined) {
      payload['link_tracking'] = link_tracking;
    }

    if (open_tracking !== undefined) {
      payload['open_tracking'] = open_tracking;
    }

    if (stop_on_auto_reply !== undefined) {
      payload['stop_on_auto_reply'] = stop_on_auto_reply;
    }

    if (daily_max_leads !== undefined) {
      payload['daily_max_leads'] = daily_max_leads;
    }

    if (prioritize_new_leads !== undefined) {
      payload['prioritize_new_leads'] = prioritize_new_leads;
    }

    if (match_lead_esp !== undefined) {
      payload['match_lead_esp'] = match_lead_esp;
    }

    if (stop_for_company !== undefined) {
      payload['stop_for_company'] = stop_for_company;
    }

    if (insert_unsubscribe_header !== undefined) {
      payload['insert_unsubscribe_header'] = insert_unsubscribe_header;
    }

    if (allow_risky_contacts !== undefined) {
      payload['allow_risky_contacts'] = allow_risky_contacts;
    }

    if (disable_bounce_protect !== undefined) {
      payload['disable_bounce_protect'] = disable_bounce_protect;
    }

    return await makeRequest({
      endpoint: 'campaigns',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });
  },
});
