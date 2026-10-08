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
    description: "Lists the connected user's Zoom cloud recordings for meetings between two dates at most one month apart, one page at a time with a next_page_token. When passing next_page_token, also pass the from and to values returned with it. Use to find recordings of recent meetings; needs a paid plan with cloud recording. Read-only and idempotent.",
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
      description: 'End date in YYYY-MM-DD format (UTC), at most one month after From Date. Defaults to today, or to one month after From Date if that is earlier. Required with Next Page Token: use the To value from the previous page so every page covers the same dates.',
      required: false,
    }),
    page_size: zoomProps.pageSize(),
    next_page_token: zoomProps.nextPageToken(),
  },
  async run(context) {
    const nextPageToken = zoomClient.optionalText(context.propsValue.next_page_token);
    const range = recordingRange({ from: context.propsValue.from, to: context.propsValue.to, today: new Date(), nextPageToken });
    const pageSize = zoomClient.pageSizeOf({ value: context.propsValue.page_size, fallback: 30 });
    const body = await zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: '/users/me/recordings',
      query: {
        from: range.from,
        to: range.to,
        page_size: pageSize,
        next_page_token: nextPageToken,
      },
      scope: 'cloud_recording:read:list_user_recordings',
    });
    return { ...zoomClient.listPage({ body, itemsKey: 'meetings' }), from: range.from, to: range.to };
  },
});

function recordingRange({
  from,
  to,
  today,
  nextPageToken,
}: {
  from: unknown;
  to: unknown;
  today: Date;
  nextPageToken?: string;
}): { from: string; to: string } {
  const fromDate = parseDay({ value: from, label: 'From Date' });
  if (fromDate === undefined) {
    throw new Error('From Date is required, in YYYY-MM-DD format.');
  }
  const limit = addOneMonth(fromDate);
  const givenTo = parseDay({ value: to, label: 'To Date' });
  if (givenTo === undefined && nextPageToken !== undefined) {
    throw new Error('To Date is required when Next Page Token is set. Use the From and To values returned with that token, so the next page covers the same dates as the previous one.');
  }
  const toDate = givenTo ?? minDate({ a: startOfDay(today), b: limit });
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
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    throw new Error(`${label} must be a date in YYYY-MM-DD format with no time part, for example 2026-10-01 (got "${text.slice(0, 40)}").`);
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
