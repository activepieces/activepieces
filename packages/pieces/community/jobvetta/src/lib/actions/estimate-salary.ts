import { createAction, Property } from '@activepieces/pieces-framework';
import { jobvettaAuth } from '../auth';
import { jobvettaGet } from '../common/client';

export const estimateSalaryAction = createAction({
  auth: jobvettaAuth,
  name: 'estimate_salary',
  displayName: 'Estimate Salary',
  description: 'Calculate live P25, median (P50), and P75 base salary benchmarks from disclosed employer job postings.',
  props: {
    q: Property.ShortText({
      displayName: 'Role Title',
      description: 'Role title or skill to benchmark (for example, Staff Software Engineer).',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Optional city, state, or country filter.',
      required: false,
    }),
    days: Property.Number({
      displayName: 'Posted Within Days',
      description: 'Recency window in days (1 to 365, default 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const { q, location, days } = context.propsValue;
    return jobvettaGet({
      apiKey: context.auth.secret_text,
      path: '/jobs/salary-estimate',
      query: {
        q,
        location,
        days: days ?? 30,
      },
    });
  },
});
