import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { jobvettaAuth } from '../auth';
import { jobvettaGet } from '../common/client';

const triggerProps = {
  q: Property.ShortText({
    displayName: 'Role or Keyword',
    description: 'Optional role title, skill, or keyword filter.',
    required: false,
  }),
  location: Property.ShortText({
    displayName: 'Location',
    description: 'Optional city, state, or country filter.',
    required: false,
  }),
  remote: Property.Checkbox({
    displayName: 'Remote Only',
    description: 'Trigger only on remote-eligible job openings.',
    required: false,
    defaultValue: false,
  }),
};

interface JobSummaryItem {
  job_id: string;
  title?: string;
  company?: string;
  location?: string;
  work_model?: string;
  employment_type?: string;
  salary?: string | null;
  url: string;
}

interface SearchJobsResponse {
  total: number;
  jobs: JobSummaryItem[];
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof jobvettaAuth>,
  StaticPropsValue<typeof triggerProps>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const response = await jobvettaGet<SearchJobsResponse>({
      apiKey: auth.secret_text,
      path: propsValue.remote ? '/jobs/remote' : '/jobs',
      query: {
        q: propsValue.q,
        location: propsValue.location,
        days: 7,
        limit: 25,
      },
    });
    const jobs = Array.isArray(response.jobs) ? response.jobs : [];
    return jobs.map((job) => ({
      id: job.job_id,
      data: job,
    }));
  },
};

export const newJobMatchingSearchTrigger = createTrigger({
  auth: jobvettaAuth,
  name: 'new_job_matching_search',
  displayName: 'New Job Matching Search',
  description: 'Triggers when a new verified employer career-site job posting matches your search filters.',
  props: triggerProps,
  sampleData: {
    job_id: '6abebf061838202552cae216_loc0',
    title: 'Senior Data Engineer',
    company: 'Datadog',
    location: 'New York, New York, United States',
    work_model: 'Hybrid',
    employment_type: 'Full-time',
    salary: '$165,000 - $210,000 / year',
    url: 'https://www.jobvetta.com/jobs/6abebf061838202552cae216_loc0',
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
