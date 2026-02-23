import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getPersonLookup = createAction({
  name: 'get_person_lookup',
  auth: enrichlayerAuth,
  displayName: 'Look Up Person',
  description:
    'Look up a person by name and company information (2 credits)',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the person (e.g., Bill)',
      required: true,
    }),
    company_domain: Property.ShortText({
      displayName: 'Company Name or Domain',
      description:
        'Company name or domain (e.g., gatesfoundation.org)',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the person (e.g., Gates)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description:
        'Title the person holds at their current job (e.g., Co-chair)',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Country, city, or state name (e.g., Seattle)',
      required: false,
    }),
    enrich_profile: Property.StaticDropdown({
      displayName: 'Enrich Profile',
      description:
        'Enrich the result with cached profile data (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Skip (default)', value: 'skip' },
          { label: 'Enrich (+1 credit)', value: 'enrich' },
        ],
      },
    }),
    similarity_checks: Property.StaticDropdown({
      displayName: 'Similarity Checks',
      description:
        'Perform similarity checks to eliminate false positives. Credits are deducted even if null is returned.',
      required: false,
      options: {
        options: [
          { label: 'Include (default)', value: 'include' },
          { label: 'Skip (no credits if no result)', value: 'skip' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.PERSON_LOOKUP,
      {
        first_name: context.propsValue.first_name,
        company_domain: context.propsValue.company_domain,
        last_name: context.propsValue.last_name,
        title: context.propsValue.title,
        location: context.propsValue.location,
        enrich_profile: context.propsValue.enrich_profile,
        similarity_checks: context.propsValue.similarity_checks,
      },
    );
  },
});
