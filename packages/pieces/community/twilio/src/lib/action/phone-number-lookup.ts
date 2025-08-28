import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioPhoneNumberLookup = createAction({
  auth: twilioAuth,
  name: 'phone_number_lookup',
  description: 'Search for calls made to or from a specific phone number.',
  displayName: 'Phone Number Lookup',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'Filter calls made to this phone number. The number should be in E.164 format (e.g., +15558675310).',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Filter calls made from this phone number. The number should be in E.164 format (e.g., +15552223214).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter calls by their status.',
      required: false,
      options: {
        options: [
          { label: 'Queued', value: 'queued' },
          { label: 'Ringing', value: 'ringing' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
          { label: 'Busy', value: 'busy' },
          { label: 'No Answer', value: 'no-answer' },
        ],
      },
    }),
    startTime: Property.ShortText({
      displayName: 'Start Time',
      description: 'Filter for calls that started on or after this date. Format: YYYY-MM-DD.',
      required: false,
    }),
    endTime: Property.ShortText({
      displayName: 'End Time',
      description: 'Filter for calls that ended on or before this date. Format: YYYY-MM-DD.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'The maximum number of results to return. The default is 50, and the maximum is 1000.',
      required: false,
    }),
  },
  async run(context) {
    const { to, from, status, startTime, endTime, pageSize } = context.propsValue;

    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    const queryParams: Record<string, string | number> = {};
    if (to) queryParams['To'] = to;
    if (from) queryParams['From'] = from;
    if (status) queryParams['Status'] = status;
    if (startTime) queryParams['StartTime>='] = startTime;
    if (endTime) queryParams['EndTime<='] = endTime;
    if (pageSize) queryParams['PageSize'] = pageSize;

    return await callTwilioApi(
      HttpMethod.GET,
      'Calls.json',
      { account_sid, auth_token },
      queryParams
    );
  },
});