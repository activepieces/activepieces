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
    from_email: Property.ShortText({
      displayName: 'From Email',
      description: 'Email address to send from',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject line for the campaign emails',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Email Body',
      description: 'HTML content for the campaign emails',
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
    schedule_timezone: Property.StaticDropdown({
      displayName: 'Schedule Timezone',
      description: 'Timezone for the schedule (must use Etc/GMT format)',
      required: true,
      defaultValue: 'Etc/GMT-5', // EDT, equivalent to America/New_York
      options: {
        options: [
          { label: 'GMT-12 (Etc/GMT+12)', value: 'Etc/GMT+12' },
          { label: 'GMT-11 (Etc/GMT+11)', value: 'Etc/GMT+11' },
          { label: 'GMT-10 (Etc/GMT+10)', value: 'Etc/GMT+10' },
          { label: 'GMT-9 (Etc/GMT+9)', value: 'Etc/GMT+9' },
          { label: 'GMT-8 (Etc/GMT+8)', value: 'Etc/GMT+8' },
          { label: 'GMT-7 (Etc/GMT+7)', value: 'Etc/GMT+7' },
          { label: 'GMT-6 (Etc/GMT+6)', value: 'Etc/GMT+6' },
          { label: 'GMT-5 (Etc/GMT+5)', value: 'Etc/GMT+5' },
          { label: 'GMT-4 (Etc/GMT+4)', value: 'Etc/GMT+4' },
          { label: 'GMT-3 (Etc/GMT+3)', value: 'Etc/GMT+3' },
          { label: 'GMT-2 (Etc/GMT+2)', value: 'Etc/GMT+2' },
          { label: 'GMT-1 (Etc/GMT+1)', value: 'Etc/GMT+1' },
          { label: 'GMT+0 (Etc/GMT)', value: 'Etc/GMT' },
          { label: 'GMT+1 (Etc/GMT-1)', value: 'Etc/GMT-1' },
          { label: 'GMT+2 (Etc/GMT-2)', value: 'Etc/GMT-2' },
          { label: 'GMT+3 (Etc/GMT-3)', value: 'Etc/GMT-3' },
          { label: 'GMT+4 (Etc/GMT-4)', value: 'Etc/GMT-4' },
          { label: 'GMT+5 (Etc/GMT-5)', value: 'Etc/GMT-5' },
          { label: 'GMT+6 (Etc/GMT-6)', value: 'Etc/GMT-6' },
          { label: 'GMT+7 (Etc/GMT-7)', value: 'Etc/GMT-7' },
          { label: 'GMT+8 (Etc/GMT-8)', value: 'Etc/GMT-8' },
          { label: 'GMT+9 (Etc/GMT-9)', value: 'Etc/GMT-9' },
          { label: 'GMT+10 (Etc/GMT-10)', value: 'Etc/GMT-10' },
          { label: 'GMT+11 (Etc/GMT-11)', value: 'Etc/GMT-11' },
          { label: 'GMT+12 (Etc/GMT-12)', value: 'Etc/GMT-12' },
        ],
      },
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
    auto_start: Property.Checkbox({
      displayName: 'Auto Start',
      description: 'Whether to start the campaign automatically',
      required: false,
      defaultValue: false,
    }),
    list_id: Property.ShortText({
      displayName: 'Lead List ID',
      description: 'ID of the lead list to use for this campaign',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      subject,
      body,
      from_email,
      schedule_time_from,
      schedule_time_to,
      schedule_timezone,
      weekday_sending,
      weekend_sending,
      start_date,
      end_date,
      auto_start,
      list_id,
    } = context.propsValue;
    const { auth: apiKey } = context;

    // Build the campaign schedule according to API v2 requirements
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

    const payload: Record<string, unknown> = {
      name,
      campaign_schedule: campaignSchedule,
    };

    if (subject) {
      payload['subject'] = subject;
    }

    if (body) {
      payload['body'] = body;
    }

    if (from_email) {
      payload['from_email'] = from_email;
    }

    if (auto_start !== undefined) {
      payload['auto_start'] = auto_start;
    }

    if (list_id) {
      payload['list_id'] = list_id;
    }

    return await makeRequest({
      endpoint: 'campaigns',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });
  },
});
