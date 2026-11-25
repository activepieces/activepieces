import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import { captainDataClient, captainDataUtils } from '../common';

export const findPerson = createAction({
  name: 'find_person',
  classification: 'SEARCH',
  displayName: 'Find Person',
  description:
    'Finds a single person by exact full name, optionally narrowed by company, and returns their LinkedIn profile URL. Costs 2 credits. Fails with an error when no unique person matches.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up one person by exact full name (and optional company name) and returns their Captain Data uid, li_profile_url and li_profile_id. Costs 2 credits per call. When there is no unique match the step fails with a Captain Data error (404 NO_RESULT) rather than returning an empty result; add company_name to narrow it. Pass li_profile_url to Enrich Person, or uid to the List Person Experiences/Skills/Certifications actions.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    full_name: Property.ShortText({
      displayName: 'Full Name',
      description: 'Exact full name of the person, e.g. "Jane Doe".',
      required: true,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Current company of the person, to narrow the match.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'uid', label: 'Person UID' },
      { key: 'li_profile_url', label: 'LinkedIn Profile URL', format: 'url' },
      { key: 'li_profile_id', label: 'LinkedIn Profile ID', format: 'number' },
      { key: 'extracted_at', label: 'Extracted At', format: 'datetime' },
    ],
  },
  async run({ auth, propsValue }) {
    return captainDataClient.getObject({
      apiKey: auth.props.apiKey,
      path: '/people/find',
      operation: 'find person',
      queryParams: {
        full_name: captainDataUtils.requireText({
          value: propsValue.full_name,
          field: 'Full Name',
        }),
        company_name: captainDataUtils.optionalText({
          value: propsValue.company_name,
        }),
      },
    });
  },
});
