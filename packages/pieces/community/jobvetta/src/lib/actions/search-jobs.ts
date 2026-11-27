import { createAction, Property } from '@activepieces/pieces-framework';
import { jobvettaAuth } from '../auth';
import { jobvettaGet } from '../common/client';

export const searchJobsAction = createAction({
  auth: jobvettaAuth,
  name: 'search_jobs',
  displayName: 'Search Jobs',
  description: 'Search live verified employer career-site job postings by role keyword, location, remote status, and recency.',
  props: {
    q: Property.ShortText({
      displayName: 'Role or Keyword',
      description: 'Role title, skill, or keyword query (for example, Senior Data Engineer or Python).',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Optional city, state, or country filter (for example, San Francisco or United States).',
      required: false,
    }),
    remote: Property.Checkbox({
      displayName: 'Remote Only',
      description: 'Return only remote-eligible job openings.',
      required: false,
      defaultValue: false,
    }),
    days: Property.Number({
      displayName: 'Posted Within Days',
      description: 'Restrict to openings published within the last N days (1 to 365).',
      required: false,
      defaultValue: 30,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum jobs to return (1 to 25 on Free tier, up to 100 on paid plans).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { q, location, remote, days, limit } = context.propsValue;
    return jobvettaGet({
      apiKey: context.auth.secret_text,
      path: remote ? '/jobs/remote' : '/jobs',
      query: {
        q,
        location,
        days: days ?? 30,
        limit: limit ?? 20,
      },
    });
  },
});
