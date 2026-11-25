import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import {
  captainDataClient,
  captainDataUtils,
  PROFILE_URL_NOT_FOUND_HINT,
} from '../common';

export const listPersonSkills = createAction({
  name: 'list_person_skills',
  classification: 'READ',
  displayName: 'List Person Skills',
  description:
    "Lists the skills on a person's LinkedIn profile, by Person UID or LinkedIn profile URL. Returns up to 20 entries; Captain Data does not page this list, so longer histories are cut at 20. Costs 1 credit plus 1 credit per 20 results.",
  audience: 'both',
  aiMetadata: {
    description:
      "Returns the skills entries on one person's LinkedIn profile. Returns up to 20 entries; Captain Data does not page this list, so longer histories are cut at 20. Identify the person with exactly one of people_uid (uid from Find Person, Search People or Find Company Employees) or li_profile_url (some profiles resolve only by people_uid; if the URL is not found, use people_uid from Find Person or Search People). Costs 1 credit plus 1 per 20 results.",
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    people_uid: Property.ShortText({
      displayName: 'Person UID',
      description:
        'The uid from Find Person, Search People or Find Company Employees. Leave empty when using the profile URL.',
      required: false,
    }),
    li_profile_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description:
        'LinkedIn profile URL (/in/, /pub/ or Sales Navigator), e.g. https://www.linkedin.com/in/jane-doe. Leave empty when using Person UID. If Captain Data cannot find the profile, use the Person UID from Find Person instead.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'items',
        label: 'List Person Skills',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Skill' },
          { key: 'extracted_at', label: 'Extracted At', format: 'datetime' },
        ],
      },
    ],
  },
  async run({ auth, propsValue }) {
    const lookup = captainDataUtils.personLookupParams({
      peopleUid: propsValue.people_uid,
      liProfileUrl: propsValue.li_profile_url,
    });
    return captainDataClient.getItems({
      apiKey: auth.props.apiKey,
      path: '/people/skills',
      operation: 'list person skills',
      queryParams: lookup,
      retryTransientNotFound: 'li_profile_url' in lookup,
      invalidInputHint:
        'li_profile_url' in lookup ? PROFILE_URL_NOT_FOUND_HINT : undefined,
    });
  },
});
