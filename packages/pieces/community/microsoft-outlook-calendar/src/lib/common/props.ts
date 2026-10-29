import { DropdownState, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../auth';
import { outlookCalendarClient } from './client';

import type { Calendar, OutlookCalendarPage, TimeZoneInformation } from './types';

function calendarId<R extends boolean>({
  required,
  displayName = 'Calendar',
  description,
}: PropParams<R>) {
  return Property.Dropdown({
    displayName,
    description,
    required,
    auth: outlookCalendarAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please authenticate first' });
      }
      const response: OutlookCalendarPage<Calendar> = await outlookCalendarClient
        .create({ auth })
        .api('/me/calendars')
        .get();
      return {
        disabled: false,
        options: response.value.map((calendar) => ({
          label: calendar.name ?? '',
          value: calendar.id ?? '',
        })),
      };
    },
  });
}

function timezone<R extends boolean>({
  required,
  displayName = 'Timezone',
  description,
}: PropParams<R>) {
  return Property.Dropdown({
    displayName,
    description,
    required,
    auth: outlookCalendarAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please authenticate first' });
      }
      const response: OutlookCalendarPage<TimeZoneInformation> = await outlookCalendarClient
        .create({ auth })
        .api('/me/outlook/supportedTimeZones')
        .get();
      return {
        disabled: false,
        options: response.value.map((tz) => ({
          label: tz.displayName ?? '',
          value: tz.alias ?? '',
        })),
      };
    },
  });
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const outlookCalendarProps = { calendarId, timezone };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
