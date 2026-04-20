import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall } from '../common';

type InterviewTime = {
  date_time?: string;
  date?: string;
};

type GreenhouseScheduledInterview = {
  id: number;
  application_id: number;
  external_event_id: string | null;
  start: InterviewTime;
  end: InterviewTime;
  location: string | null;
  video_conferencing_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  interview: { id: number; name: string } | null;
  organizer: {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    employee_id: string | null;
  } | null;
  interviewers: {
    id: number;
    employee_id: string | null;
    name: string;
    email: string;
    response_status: string;
    scorecard_id: number | null;
  }[];
};

type TriggerProps = { days_ahead: number };
type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, TriggerProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const apiKey = (auth as { secret_text: string }).secret_text;
    const daysAhead = propsValue.days_ahead ?? 7;

    const createdAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const startsBefore = new Date(
      Date.now() + daysAhead * 24 * 60 * 60 * 1000
    ).toISOString();

    const response = await greenhouseApiCall<GreenhouseScheduledInterview[]>({
      apiKey,
      method: HttpMethod.GET,
      endpoint: '/scheduled_interviews',
      queryParams: {
        created_after: createdAfter,
        starts_before: startsBefore,
        per_page: '100',
      },
    });

    const interviews = response.body ?? [];

    return interviews.map((interview) => ({
      epochMilliSeconds: new Date(interview.created_at).getTime(),
      data: {
        id: interview.id,
        application_id: interview.application_id,
        external_event_id: interview.external_event_id,
        status: interview.status,
        interview_id: interview.interview?.id ?? null,
        interview_name: interview.interview?.name ?? null,
        start_date_time: interview.start?.date_time ?? interview.start?.date ?? null,
        end_date_time: interview.end?.date_time ?? interview.end?.date ?? null,
        location: interview.location,
        video_conferencing_url: interview.video_conferencing_url,
        organizer_id: interview.organizer?.id ?? null,
        organizer_name: interview.organizer?.name ?? null,
        interviewer_ids: (interview.interviewers ?? []).map((i) => i.id).join(', '),
        interviewer_names: (interview.interviewers ?? []).map((i) => i.name).join(', '),
        interviewer_emails: (interview.interviewers ?? []).map((i) => i.email).join(', '),
        created_at: interview.created_at,
        updated_at: interview.updated_at,
      },
    }));
  },
};

export const newScheduledInterviewTrigger = createTrigger({
  auth: greenhouseAuth,
  name: 'new_scheduled_interview',
  displayName: 'New Scheduled Interview',
  description: 'Triggers when a new scheduled interview is created within the configured time window.',
  props: {
    days_ahead: Property.Number({
      displayName: 'Time Window (Days)',
      description:
        'Only trigger for interviews scheduled to start within this many days from now. For example, `7` means only interviews starting within the next week will fire this trigger.',
      required: true,
      defaultValue: 7,
    }),
  },
  sampleData: {
    id: 109170954,
    application_id: 102717457,
    external_event_id: 'external_event_id_1',
    status: 'scheduled',
    interview_id: 8055374,
    interview_name: 'Executive Interview',
    start_date_time: '2024-03-20T13:15:00.000Z',
    end_date_time: '2024-03-20T14:15:00.000Z',
    location: 'Big Conference Room',
    video_conferencing_url: 'https://zoom.us/j/123456789',
    organizer_id: 102361,
    organizer_name: 'Champ Telluride',
    interviewer_ids: '102361, 46444',
    interviewer_names: 'Champ Telluride, Lucius Barbarossa',
    interviewer_emails: 'champ@example.com, lucius@example.com',
    created_at: '2024-03-10T19:22:07.000Z',
    updated_at: '2024-03-10T19:22:07.000Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
