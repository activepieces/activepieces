import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const setSchedule = createAction({
  auth: ReachinboxAuth,
  name: 'setSchedule',
  displayName: 'Set Schedule',
  description: 'Update the schedule for a specific Campaign',
  props: {
    campaignId: Property.Dropdown({
      displayName: 'Select Campaign',
      description:
        'Choose a campaign from the list or enter the campaign ID manually.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const campaigns = await fetchCampaigns(auth as string);

        return {
          options: campaigns.map((campaign) => ({
            label: campaign.name,
            value: campaign.id.toString(),
          })),
          disabled: campaigns.length === 0,
        };
      },
    }),
    scheduleName: Property.ShortText({
      displayName: 'Schedule Name',
      description: 'Enter the schedule name here (e.g., New schedule).',
      required: true,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Enter the start date (e.g., 2023-08-01T00:00:00.000Z).',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Enter the end date (e.g., 2024-08-25T00:00:00.000Z).',
      required: true,
    }),
    startTime: Property.ShortText({
      displayName: 'Start Time',
      description: 'Enter the start time (e.g., 09:00).',
      required: true,
    }),
    endTime: Property.ShortText({
      displayName: 'End Time',
      description: 'Enter the end time (e.g., 12:00).',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Enter the timezone (e.g., America/Detroit).',
      required: true,
    }),
    sunday: Property.Checkbox({
      displayName: 'Sunday',
      description: 'Choose "Yes" if you want to set a schedule for Sunday.',
      required: true,
      defaultValue: false,
    }),
    monday: Property.Checkbox({
      displayName: 'Monday',
      description: 'Choose "Yes" if you want to set a schedule for Monday.',
      required: true,
      defaultValue: false,
    }),
    tuesday: Property.Checkbox({
      displayName: 'Tuesday',
      description: 'Choose "Yes" if you want to set a schedule for Tuesday.',
      required: true,
      defaultValue: false,
    }),
    wednesday: Property.Checkbox({
      displayName: 'Wednesday',
      description: 'Choose "Yes" if you want to set a schedule for Wednesday.',
      required: true,
      defaultValue: false,
    }),
    thursday: Property.Checkbox({
      displayName: 'Thursday',
      description: 'Choose "Yes" if you want to set a schedule for Thursday.',
      required: true,
      defaultValue: false,
    }),
    friday: Property.Checkbox({
      displayName: 'Friday',
      description: 'Choose "Yes" if you want to set a schedule for Friday.',
      required: true,
      defaultValue: false,
    }),
    saturday: Property.Checkbox({
      displayName: 'Saturday',
      description: 'Choose "Yes" if you want to set a schedule for Saturday.',
      required: true,
      defaultValue: false,
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
          Authorization: `Bearer ${context.auth as string}`,
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
