import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { ZoomApiError, zoomClient } from './client';

export const zoomMeetingDropdown = Property.Dropdown({
  displayName: 'Meeting',
  description: 'Select a meeting from your Zoom account.',
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
    description: 'The meeting ID.',
    required: true,
  }),
  first_name: Property.ShortText({
    displayName: 'First name',
    description: "The registrant's first name.",
    required: true,
  }),
  last_name: Property.ShortText({
    displayName: 'Last name',
    description: "The registrant's last name.",
    required: false,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    description: "The registrant's email address.",
    required: true,
  }),
  address: Property.ShortText({
    displayName: 'Address',
    description: "The registrant's address",
    required: false,
  }),
  city: Property.ShortText({
    displayName: 'City',
    description: "The registrant's city",
    required: false,
  }),
  state: Property.ShortText({
    displayName: 'State',
    description: "The registrant's state or province.",
    required: false,
  }),
  zip: Property.ShortText({
    displayName: 'Zip',
    description: "The registrant's zip or postal code.",
    required: false,
  }),
  country: Property.ShortText({
    displayName: 'Country',
    description: "The registrant's two-letter country code.",
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    description: "The registrant's phone number.",
    required: false,
  }),
  comments: Property.LongText({
    displayName: 'Comments',
    description: "The registrant's questions and comments.",
    required: false,
  }),
  custom_questions: Property.Object({
    displayName: 'Custom questions',
    description: 'Answers to the meeting\'s custom registration questions: use the question title as the key and the answer as the value.',
    required: false,
  }),
  industry: Property.ShortText({
    displayName: 'Industry',
    description: "The registrant's industry.",
    required: false,
  }),
  job_title: Property.ShortText({
    displayName: 'Job title',
    description: "The registrant's job title.",
    required: false,
  }),
  no_of_employees: Property.StaticDropdown({
    displayName: 'No of employees',
    description: "The registrant's number of employees.",
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
    description: "The registrant's organization.",
    required: false,
  }),
  purchasing_time_frame: Property.StaticDropdown({
    displayName: 'Purchasing time frame',
    description: "The registrant's purchasing time frame.",
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
    displayName: 'Role in purchase process',
    description: "The registrant's role in the purchase process.",
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
  meetingId: ({ description }: { description: string }) =>
    Property.ShortText({
      displayName: 'Meeting ID',
      description,
      required: true,
    }),
  occurrenceId: () =>
    Property.ShortText({
      displayName: 'Occurrence ID',
      description: 'Only for recurring meetings: the occurrence ID of one specific occurrence. Leave empty to target the whole meeting.',
      required: false,
    }),
  pageSize: () =>
    Property.Number({
      displayName: 'Page Size',
      description: 'How many records to return in this page (1-300). Default 30.',
      required: false,
      defaultValue: 30,
    }),
  nextPageToken: () =>
    Property.ShortText({
      displayName: 'Next Page Token',
      description: 'Leave empty for the first page. To get the next page, paste the Next Page Token from the previous run.',
      required: false,
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
        options.push({ label: topic, value: String(meeting['id']) });
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
