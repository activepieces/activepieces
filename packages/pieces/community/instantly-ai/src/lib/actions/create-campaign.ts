import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { InstantlyCampaign, InstantlyCampaignSchedule } from '../common/types';

function filterUndefined(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  );
}

export const createCampaignAction = createAction({
  auth: instantlyAuth,
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
      description:
        'Stop campaign for the company (domain) when a lead replies',
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
      ...optionalFields
    } = context.propsValue;

    const campaignSchedule: InstantlyCampaignSchedule = {
      schedules: [
        {
          name: 'Default Schedule',
          timing: {
            from: schedule_time_from,
            to: schedule_time_to,
          },
          days: {
            '0': weekday_sending ?? true,
            '1': weekday_sending ?? true,
            '2': weekday_sending ?? true,
            '3': weekday_sending ?? true,
            '4': weekday_sending ?? true,
            '5': weekend_sending ?? false,
            '6': weekend_sending ?? false,
          },
          timezone: schedule_timezone,
        },
      ],
      ...(start_date ? { start_date } : {}),
      ...(end_date ? { end_date } : {}),
    };

    const payload = filterUndefined({
      name,
      campaign_schedule: campaignSchedule,
      ...optionalFields,
    });

    return instantlyClient.makeRequest<InstantlyCampaign>({
      auth: context.auth.secret_text,
      method: HttpMethod.POST,
      path: 'campaigns',
      body: payload,
    });
  },
});
