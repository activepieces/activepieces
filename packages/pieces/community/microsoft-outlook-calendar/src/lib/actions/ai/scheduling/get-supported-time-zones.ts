import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarClient } from '../../../common/client';

import type { OutlookCalendarPage, TimeZoneInformation } from '../../../common/types';
import { outlookCalendarTimeZoneListOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetSupportedTimeZonesAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_supported_time_zones',
  outputSchema: outlookCalendarTimeZoneListOutputSchema,
  displayName: 'Get Supported Time Zones',
  description: "Lists the time zones supported by the user's mailbox server.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Lists the time zones the signed-in user's mailbox supports, each with its alias and display name. Use an alias as the time zone of event and schedule actions; pick the standard to get Windows names or IANA names.",
    idempotent: true,
  },
  props: {
    timeZoneStandard: Property.StaticDropdown({
      displayName: 'Time Zone Standard',
      description:
        'Naming standard for the returned aliases: windows (e.g. "Pacific Standard Time") or iana (e.g. "America/Los_Angeles"). Defaults to windows.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Windows', value: 'windows' },
          { label: 'IANA', value: 'iana' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { timeZoneStandard } = propsValue;
    const response: OutlookCalendarPage<TimeZoneInformation> = await outlookCalendarClient
      .create({ auth })
      .api(
        timeZoneStandard
          ? `/me/outlook/supportedTimeZones(TimeZoneStandard=microsoft.graph.timeZoneStandard'${encodeURIComponent(
              timeZoneStandard,
            )}')`
          : '/me/outlook/supportedTimeZones',
      )
      .get();
    return response;
  },
});
