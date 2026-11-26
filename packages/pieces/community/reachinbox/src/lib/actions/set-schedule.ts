import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const setSchedule = createAction({
  auth: ReachinboxAuth,
  name: 'setSchedule',
  classification: 'WRITE',
  displayName: 'Set Campaign Schedule',
  description: 'Sets the dates, hours and days a campaign sends on.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the sending schedule for a ReachInbox campaign: active date range, daily start/end times, timezone, and which weekdays are enabled. Use to control when a campaign sends. Requires a campaign id; idempotent since it replaces the schedule with the supplied values.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'schedule',
      display: 'section',
      label: 'Schedule',
      icon: 'calendar',
      props: ['campaignId', 'scheduleName', 'startDate', 'endDate'],
    },
    {
      key: 'hours',
      display: 'section',
      label: 'Sending Hours',
      icon: 'sliders',
      props: ['startTime', 'endTime', 'timezone'],
    },
    {
      key: 'days',
      display: 'section',
      label: 'Sending Days',
      icon: 'calendar',
      props: [
        'daysInfo',
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ],
    },
  ],
  props: {
    campaignId: Property.Dropdown({
      auth: ReachinboxAuth,
      displayName: 'Campaign',
      description: 'Your campaigns, newest first.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const campaigns = await fetchCampaigns(auth.secret_text);
          if (campaigns.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No campaigns found. Create one in ReachInbox first.',
            };
          }
          return {
            options: campaigns.map((campaign) => ({
              label: reachinboxCommon.campaignLabel(campaign),
              value: campaign.id.toString(),
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load campaigns. Check your connection.',
          };
        }
      },
    }),
    scheduleName: Property.ShortText({
      displayName: 'Schedule Name',
      placeholder: 'Weekdays',
      required: true,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day the campaign can send.',
      required: true,
      width: 'half',
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day the campaign can send.',
      required: true,
      width: 'half',
    }),
    startTime: Property.ShortText({
      displayName: 'Start Time',
      description: '24-hour time, HH:mm.',
      placeholder: '09:00',
      required: true,
      width: 'half',
    }),
    endTime: Property.ShortText({
      displayName: 'End Time',
      description: '24-hour time, HH:mm.',
      placeholder: '17:00',
      required: true,
      width: 'half',
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA time zone name.',
      placeholder: 'America/New_York',
      required: true,
    }),
    daysInfo: Property.MarkDown({
      value: 'The campaign only sends on the days switched on.',
      variant: MarkdownVariant.INFO,
    }),
    sunday: Property.Checkbox({
      displayName: 'Sunday',
      required: true,
      defaultValue: false,
      width: 'half',
    }),
    monday: Property.Checkbox({
      displayName: 'Monday',
      required: true,
      defaultValue: false,
      width: 'half',
    }),
    tuesday: Property.Checkbox({
      displayName: 'Tuesday',
      required: true,
      defaultValue: false,
      width: 'half',
    }),
    wednesday: Property.Checkbox({
      displayName: 'Wednesday',
      required: true,
      defaultValue: false,
      width: 'half',
    }),
    thursday: Property.Checkbox({
      displayName: 'Thursday',
      required: true,
      defaultValue: false,
      width: 'half',
    }),
    friday: Property.Checkbox({
      displayName: 'Friday',
      required: true,
      defaultValue: false,
      width: 'half',
    }),
    saturday: Property.Checkbox({
      displayName: 'Saturday',
      required: true,
      defaultValue: false,
      width: 'half',
    }),
  },
  async run(context) {
    const {
      campaignId,
      scheduleName,
      startDate,
      endDate,
      startTime,
      endTime,
      timezone,
      sunday,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
    } = context.propsValue;

    const schedules = [
      {
        name: scheduleName,
        timing: {
          from: startTime,
          to: endTime,
        },
        days: {
          '0': sunday,
          '1': monday,
          '2': tuesday,
          '3': wednesday,
          '4': thursday,
          '5': friday,
          '6': saturday,
        },
        timezone: timezone,
      },
    ];

    const url = `${reachinboxCommon.baseUrl}campaigns/set-schedule`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: url,
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
          'Content-Type': 'application/json',
        },
        body: {
          campaignId: campaignId,
          startDate: startDate,
          endDate: endDate,
          schedules: schedules,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          message: response.body.message || 'Schedule updated successfully.',
        };
      } else {
        throw new Error(`Failed to update schedule: ${response.body.message}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to update schedule: ${error.message}`);
    }
  },
});
