import type { AppConnectionType } from '@activepieces/pieces-framework';

export type {
  Attachment,
  Calendar,
  CalendarGroup,
  CalendarPermission,
  CalendarRoleType,
  Event,
  Extension,
  Reminder,
  ScheduleInformation,
  TimeZoneInformation,
} from '@microsoft/microsoft-graph-types';

export type OutlookCalendarAuthValue = {
  type:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  props?: { cloud?: string | null };
};

export type OutlookCalendarPage<T> = {
  value: T[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
};
