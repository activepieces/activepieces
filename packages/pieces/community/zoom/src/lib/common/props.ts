import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { ZoomApiError, zoomClient } from './client';

export const zoomMeetingDropdown = Property.Dropdown({
  displayName: 'Meeting',
  description: 'Pick one of your scheduled Zoom meetings.',
  required: true,
  auth: zoomAuth,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Zoom account first.',
        options: [],
      };
    }
    try {
      const options = await loadScheduledMeetings({ accessToken: auth.access_token });
      return { disabled: false, options };
    } catch (error) {
      return {
        disabled: true,
        placeholder: dropdownErrorReason(error),
        options: [],
      };
    }
  },
});

export const getRegistarantProps = () => ({
  meeting_id: Property.ShortText({
    displayName: 'Meeting ID',
    description: 'The number in the meeting link after /j/, or from List Meetings.',
    placeholder: '85746065432',
    required: true,
  }),
  first_name: Property.ShortText({
    displayName: 'First Name',
    placeholder: 'Jane',
    required: true,
    width: 'half',
  }),
  last_name: Property.ShortText({
    displayName: 'Last Name',
    placeholder: 'Doe',
    required: false,
    width: 'half',
  }),
  email: Property.ShortText({
    displayName: 'Email',
    placeholder: 'jane@example.com',
    required: true,
  }),
  address: Property.ShortText({
    displayName: 'Address',
    placeholder: '1 Main Street',
    required: false,
  }),
  city: Property.ShortText({
    displayName: 'City',
    placeholder: 'Springfield',
    required: false,
    width: 'half',
  }),
  state: Property.ShortText({
    displayName: 'State',
    description: 'State or province.',
    required: false,
    width: 'half',
  }),
  zip: Property.ShortText({
    displayName: 'ZIP Code',
    description: 'ZIP or postal code.',
    required: false,
    width: 'half',
  }),
  country: Property.ShortText({
    displayName: 'Country',
    description: 'Two-letter country code.',
    placeholder: 'US',
    required: false,
    width: 'half',
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    placeholder: '+1 555 0100',
    required: false,
  }),
  comments: Property.LongText({
    displayName: 'Comments',
    description: 'Questions or comments from the registrant.',
    required: false,
  }),
  custom_questions: Property.Object({
    displayName: 'Custom Questions',
    description: "Answers to the meeting's custom questions: question title as key.",
    required: false,
  }),
  industry: Property.ShortText({
    displayName: 'Industry',
    required: false,
  }),
  job_title: Property.ShortText({
    displayName: 'Job Title',
    placeholder: 'Marketing Manager',
    required: false,
    width: 'half',
  }),
  no_of_employees: Property.StaticDropdown({
    displayName: 'Number of Employees',
    description: "Size of the registrant's company.",
    required: false,
    options: {
      disabled: false,
      options: [
        { label: '1-20', value: '1-20' },
        { label: '21-50', value: '21-50' },
        { label: '51-100', value: '51-100' },
        { label: '101-500', value: '101-500' },
        { label: '500-1,000', value: '500-1,000' },
        { label: '1,001-5,000', value: '1,001-5,000' },
        { label: '5,001-10,000', value: '5,001-10,000' },
        { label: 'More than 10,000', value: 'More than 10,000' },
      ],
    },
  }),
  org: Property.ShortText({
    displayName: 'Organization',
    placeholder: 'Acme Inc',
    required: false,
    width: 'half',
  }),
  purchasing_time_frame: Property.StaticDropdown({
    displayName: 'Purchasing Time Frame',
    description: 'When the registrant plans to buy.',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Within a month', value: 'Within a month' },
        { label: '1-3 months', value: '1-3 months' },
        { label: '4-6 months', value: '4-6 months' },
        { label: 'More than 6 months', value: 'More than 6 months' },
        { label: 'No timeframe', value: 'No timeframe' },
      ],
    },
  }),
  role_in_purchase_process: Property.StaticDropdown({
    displayName: 'Role in Purchase Process',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Decision Maker', value: 'Decision Maker' },
        { label: 'Evaluator/Recommender', value: 'Evaluator/Recommender' },
        { label: 'Influencer', value: 'Influencer' },
        { label: 'Not involved', value: 'Not involved' },
      ],
    },
  }),
});

export const zoomProps = {
  meetingId: ({ description, placeholder }: { description: string; placeholder?: string }) =>
    Property.ShortText({
      displayName: 'Meeting ID',
      description,
      placeholder,
      required: true,
    }),
  occurrenceId: ({ description }: { description?: string } = {}) =>
    Property.ShortText({
      displayName: 'Occurrence ID',
      description: description ?? 'Only for recurring meetings: the occurrence ID of one specific occurrence. Leave empty to target the whole meeting.',
      required: false,
    }),
  pageSize: () =>
    Property.Number({
      displayName: 'Page Size',
      description: 'Results per page, from 1 to 300. Default 30.',
      required: false,
      defaultValue: 30,
    }),
  nextPageToken: () =>
    Property.ShortText({
      displayName: 'Next Page Token',
      description: 'Empty: first page. For more, paste Next Page Token from the last run.',
      required: false,
      advanced: true,
    }),
};

async function loadScheduledMeetings({ accessToken }: { accessToken: string }): Promise<{ label: string; value: string }[]> {
  const options: { label: string; value: string }[] = [];
  const seenTokens = new Set<string>();
  let nextPageToken: string | undefined = undefined;
  do {
    const body: Record<string, unknown> = await zoomClient.requestObject({
      accessToken,
      method: HttpMethod.GET,
      path: '/users/me/meetings',
      query: { type: 'scheduled', page_size: 300, next_page_token: nextPageToken },
      scope: 'meeting:read:list_meetings',
    });
    const meetings = Array.isArray(body['meetings']) ? body['meetings'] : [];
    for (const meeting of meetings) {
      if (zoomClient.isRecord(meeting) && meeting['id'] !== undefined) {
        const topic = typeof meeting['topic'] === 'string' && meeting['topic'].length > 0 ? meeting['topic'] : `Meeting ${String(meeting['id'])}`;
        options.push({ label: meetingLabel({ topic, startTime: meeting['start_time'] }), value: String(meeting['id']) });
      }
    }
    const token = body['next_page_token'];
    nextPageToken = typeof token === 'string' && token.length > 0 && !seenTokens.has(token) ? token : undefined;
    if (nextPageToken !== undefined) {
      seenTokens.add(nextPageToken);
    }
  } while (nextPageToken !== undefined);
  return options;
}

function meetingLabel({ topic, startTime }: { topic: string; startTime: unknown }): string {
  if (typeof startTime === 'string' && startTime.length >= 10) {
    return `${topic} (${startTime.slice(0, 10)})`;
  }
  return topic;
}

function dropdownErrorReason(error: unknown): string {
  if (error instanceof ZoomApiError) {
    if (error.code === 4711 || /does not contain scopes/i.test(error.message)) {
      return 'Your Zoom app is missing the meeting:read:list_meetings scope. Add it in the Zoom Marketplace app and reconnect.';
    }
    if (error.status === 401) {
      return 'Zoom did not accept the connection. Reconnect your Zoom account.';
    }
    if (error.status === 429) {
      return 'Zoom rate limit reached. Wait a moment and refresh.';
    }
    return `Could not load meetings: ${error.message.slice(0, 200)}`;
  }
  return 'Could not load meetings from Zoom. Try again or reconnect your Zoom account.';
}
