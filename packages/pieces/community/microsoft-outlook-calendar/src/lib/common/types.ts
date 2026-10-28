import type { AppConnectionType } from '@activepieces/pieces-framework';

export type OutlookCalendarAuthValue = {
  type:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  props?: { cloud?: string | null };
};

export type OutlookCalendarCalendar = { id: string; name: string };

export type OutlookCalendarTimeZone = { displayName: string; alias: string };

export type OutlookCalendarList<T> = { value: T[] };
