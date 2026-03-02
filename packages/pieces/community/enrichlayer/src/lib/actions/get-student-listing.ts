import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getStudentListing = createAction({
  name: 'get_student_listing',
  auth: enrichlayerAuth,
  displayName: 'List School Students',
  description:
    'Get a list of students at a school (3 credits per student returned)',
  props: {
    school_url: Property.ShortText({
      displayName: 'School URL',
      description:
        'Professional network school URL (e.g., https://www.linkedin.com/school/stanford-university)',
      required: true,
    }),
    page_size: Property.ShortText({
      displayName: 'Page Size',
      description: 'Maximum results per call (1-9999, default: 10)',
      required: false,
    }),
    student_status: Property.StaticDropdown({
      displayName: 'Student Status',
      description: 'Filter by current, past, or all students',
      required: false,
      options: {
        options: [
          { label: 'Current (default)', value: 'current' },
          { label: 'Past', value: 'past' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    enrich_profiles: Property.StaticDropdown({
      displayName: 'Enrich Profiles',
      description: 'Return full profiles instead of just URLs (+1 credit each)',
      required: false,
      options: {
        options: [
          { label: 'Skip (default)', value: 'skip' },
          { label: 'Enrich (+1 credit each)', value: 'enrich' },
        ],
      },
    }),
    boolean_search_keyword: Property.ShortText({
      displayName: 'Boolean Search Keyword',
      description:
        'Filter students by major using boolean expression (e.g., "computer OR cs"). Base: 10 credits + 6 per student.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Filter by country (ISO 3166-1 alpha-2, e.g., us). +3 credits per result.',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description:
        'Sort students (+50 credits base + 10 per student returned)',
      required: false,
      options: {
        options: [
          { label: 'None (default)', value: 'none' },
          { label: 'Recently Matriculated', value: 'recently-matriculated' },
          { label: 'Recently Graduated', value: 'recently-graduated' },
        ],
      },
    }),
    resolve_numeric_id: Property.StaticDropdown({
      displayName: 'Resolve Numeric ID',
      description:
        'Enable support for school URLs with numerical IDs (+2 credits)',
      required: false,
      options: {
        options: [
          { label: 'False (default)', value: 'false' },
          { label: 'True (+2 credits)', value: 'true' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.STUDENT_LISTING,
      {
        school_url: context.propsValue.school_url,
        page_size: context.propsValue.page_size,
        student_status: context.propsValue.student_status,
        enrich_profiles: context.propsValue.enrich_profiles,
        boolean_search_keyword: context.propsValue.boolean_search_keyword,
        country: context.propsValue.country,
        sort_by: context.propsValue.sort_by,
        resolve_numeric_id: context.propsValue.resolve_numeric_id,
      },
    );
  },
});
