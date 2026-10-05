import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { listRecordingsOutputSchema } from '../output-schemas';

export const zoomListRecordings = createAction({
  auth: zoomAuth,
  name: 'zoom_list_recordings',
  displayName: 'List Cloud Recordings',
  description: 'List the cloud recordings of the connected user between two dates (paid Zoom plan with cloud recording).',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: "Lists the connected user's Zoom cloud recordings for meetings between two dates at most one month apart, one page at a time with a next_page_token. Use to find recordings of recent meetings; needs a paid plan with cloud recording. Read-only and idempotent.",
    idempotent: true,
  },
  outputSchema: listRecordingsOutputSchema,
  props: {
    from: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date in YYYY-MM-DD format (UTC), for example 2026-10-01.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To Date',
      description: 'End date in YYYY-MM-DD format (UTC), at most one month after From Date. Defaults to today, or to one month after From Date if that is earlier.',
      required: false,
    }),
    page_size: zoomProps.pageSize(),
    next_page_token: zoomProps.nextPageToken(),
  },
  async run(context) {
    const range = recordingRange({ from: context.propsValue.from, to: context.propsValue.to, today: new Date() });
    const pageSize = zoomClient.pageSizeOf({ value: context.propsValue.page_size, fallback: 30 });
    const body = await zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: '/users/me/recordings',
      query: {
        from: range.from,
        to: range.to,
        page_size: pageSize,
        next_page_token: zoomClient.optionalText(context.propsValue.next_page_token),
      },
      scope: 'cloud_recording:read:list_user_recordings',
    });
    return zoomClient.listPage({ body, itemsKey: 'meetings' });
  },
});

function recordingRange({ from, to, today }: { from: unknown; to: unknown; today: Date }): { from: string; to: string } {
  const fromDate = parseDay({ value: from, label: 'From Date' });
  if (fromDate === undefined) {
    throw new Error('From Date is required, in YYYY-MM-DD format.');
  }
  const limit = addOneMonth(fromDate);
  const toDate = parseDay({ value: to, label: 'To Date' }) ?? minDate({ a: startOfDay(today), b: limit });
  if (toDate.getTime() < fromDate.getTime()) {
    throw new Error('To Date must be on or after From Date.');
  }
  if (toDate.getTime() > limit.getTime()) {
    throw new Error(`Zoom returns at most one month of recordings per request: To Date must be on or before ${formatDay(limit)}. Run the step once per month.`);
  }
  return { from: formatDay(fromDate), to: formatDay(toDate) };
}

function parseDay({ value, label }: { value: unknown; label: string }): Date | undefined {
  const text = zoomClient.optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) {
    throw new Error(`${label} must be a date in YYYY-MM-DD format, for example 2026-10-01.`);
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (formatDay(date) !== `${match[1]}-${match[2]}-${match[3]}`) {
    throw new Error(`${label} "${text}" is not a real calendar date.`);
  }
  return date;
}

function addOneMonth(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function minDate({ a, b }: { a: Date; b: Date }): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const listRecordingsHelpers = { recordingRange };
