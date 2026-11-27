import { createAction, Property } from '@activepieces/pieces-framework';
import { jobvettaAuth } from '../auth';
import { jobvettaGet } from '../common/client';

export const getCompanyHiringSignalsAction = createAction({
  auth: jobvettaAuth,
  name: 'get_company_hiring_signals',
  displayName: 'Get Company Hiring Signals',
  description: 'Retrieve active job openings and hiring velocity counts for a specific employer.',
  props: {
    company: Property.ShortText({
      displayName: 'Company Name',
      description: 'Hiring employer name (for example, Datadog, Cisco Systems, or Stripe).',
      required: true,
    }),
    q: Property.ShortText({
      displayName: 'Role or Department Filter',
      description: 'Optional keyword filter within the company openings (for example, Security or Sales).',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Optional city, state, or country filter.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum openings to return (default 25).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { company, q, location, limit } = context.propsValue;
    return jobvettaGet({
      apiKey: context.auth.secret_text,
      path: `/companies/${encodeURIComponent(company.trim())}/jobs`,
      query: {
        q,
        location,
        limit: limit ?? 25,
      },
    });
  },
});
