import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall } from '../common';

type GreenhouseJobPost = {
  id: number;
  title: string;
  job_id: number;
  job_board_id: number;
  location: { type: string; name: string; id: number | null } | null;
  internal: boolean;
  active: boolean;
  live: boolean;
  featured: boolean;
  first_published_at: string | null;
  public_url: string | null;
  language: string | null;
  demographic_question_set_id: number | null;
  created_at: string;
  updated_at: string;
};

type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const createdAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseJobPost[]>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      endpoint: '/job_posts',
      queryParams: {
        'created_at[gte]': createdAfter,
        per_page: '500',
      },
    });

    const jobPosts = Array.isArray(response.body) ? response.body : [];

    return jobPosts.map((post) => ({
      epochMilliSeconds: new Date(post.created_at).getTime(),
      data: {
        id: post.id,
        title: post.title,
        job_id: post.job_id,
        job_board_id: post.job_board_id,
        location_name: post.location?.name ?? null,
        location_type: post.location?.type ?? null,
        location_id: post.location?.id ?? null,
        internal: post.internal,
        active: post.active,
        live: post.live,
        featured: post.featured,
        public_url: post.public_url,
        language: post.language,
        first_published_at: post.first_published_at,
        demographic_question_set_id: post.demographic_question_set_id,
        created_at: post.created_at,
        updated_at: post.updated_at,
      },
    }));
  },
};

export const newJobPostTrigger = createTrigger({
  auth: greenhouseAuth,
  name: 'new_job_post',
  displayName: 'New Job Post',
  description: 'Triggers when a new job post is created.',
  props: {},
  sampleData: {
    id: 123,
    title: 'Software Engineer',
    job_id: 1234,
    job_board_id: 56,
    location_name: 'New York, NY',
    location_type: 'free_text',
    location_id: null,
    internal: false,
    active: true,
    live: true,
    featured: false,
    public_url: 'https://boards.greenhouse.io/acme/jobs/123',
    language: 'en',
    first_published_at: '2024-03-15T10:00:00.000Z',
    demographic_question_set_id: null,
    created_at: '2024-03-15T09:00:00.000Z',
    updated_at: '2024-03-15T10:00:00.000Z',
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
