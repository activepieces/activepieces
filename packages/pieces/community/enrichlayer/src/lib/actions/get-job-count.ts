import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getJobCount = createAction({
  name: 'get_job_count',
  auth: enrichlayerAuth,
  displayName: 'Get Job Count',
  description:
    'Count the number of jobs posted by a company (2 credits)',
  props: {
    search_id: Property.ShortText({
      displayName: 'Company Search ID',
      description:
        'The search_id of the company (from Company Profile API)',
      required: false,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Keyword to search for (e.g., engineer)',
      required: false,
    }),
    job_type: Property.StaticDropdown({
      displayName: 'Job Type',
      description: 'Filter by job type',
      required: false,
      options: {
        options: [
          { label: 'Anything (default)', value: 'anything' },
          { label: 'Full-time', value: 'full-time' },
          { label: 'Part-time', value: 'part-time' },
          { label: 'Contract', value: 'contract' },
          { label: 'Internship', value: 'internship' },
          { label: 'Temporary', value: 'temporary' },
          { label: 'Volunteer', value: 'volunteer' },
        ],
      },
    }),
    experience_level: Property.StaticDropdown({
      displayName: 'Experience Level',
      description: 'Filter by experience level',
      required: false,
      options: {
        options: [
          { label: 'Anything (default)', value: 'anything' },
          { label: 'Internship', value: 'internship' },
          { label: 'Entry Level', value: 'entry_level' },
          { label: 'Associate', value: 'associate' },
          { label: 'Mid-Senior Level', value: 'mid_senior_level' },
          { label: 'Director', value: 'director' },
        ],
      },
    }),
    when: Property.StaticDropdown({
      displayName: 'When Posted',
      description: 'Filter by when the job was posted',
      required: false,
      options: {
        options: [
          { label: 'Anytime (default)', value: 'anytime' },
          { label: 'Yesterday', value: 'yesterday' },
          { label: 'Past Week', value: 'past-week' },
          { label: 'Past Month', value: 'past-month' },
        ],
      },
    }),
    flexibility: Property.StaticDropdown({
      displayName: 'Flexibility',
      description: 'Filter by work flexibility',
      required: false,
      options: {
        options: [
          { label: 'Anything (default)', value: 'anything' },
          { label: 'Remote', value: 'remote' },
          { label: 'On-site', value: 'on-site' },
          { label: 'Hybrid', value: 'hybrid' },
        ],
      },
    }),
    geo_id: Property.ShortText({
      displayName: 'Geo ID',
      description:
        'Geographic location ID (e.g., 92000000 for worldwide)',
      required: false,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.JOB_COUNT,
      {
        search_id: context.propsValue.search_id,
        keyword: context.propsValue.keyword,
        job_type: context.propsValue.job_type,
        experience_level: context.propsValue.experience_level,
        when: context.propsValue.when,
        flexibility: context.propsValue.flexibility,
        geo_id: context.propsValue.geo_id,
      },
    );
  },
});
