import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import {
  captainDataClient,
  captainDataUtils,
  PROFILE_URL_NOT_FOUND_HINT,
} from '../common';

export const listPersonCertifications = createAction({
  name: 'list_person_certifications',
  classification: 'READ',
  displayName: 'List Person Certifications',
  description:
    "Lists the certifications on a person's LinkedIn profile, by Person UID or LinkedIn profile URL. Costs 1 credit plus 1 credit per 20 results.",
  audience: 'both',
  aiMetadata: {
    description:
      "Returns the certifications entries on one person's LinkedIn profile; when has_more is true, call again with cursor set to next_cursor. Identify the person with exactly one of people_uid (uid from Find Person, Search People or Find Company Employees) or li_profile_url (some profiles resolve only by people_uid; if the URL is not found, use people_uid from Find Person or Search People). Costs 1 credit plus 1 per 20 results.",
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
        'Public LinkedIn profile URL in the /in/ form only (Sales Navigator and /pub/ URLs are not accepted), e.g. https://www.linkedin.com/in/jane-doe. Leave empty when using Person UID. If Captain Data cannot find the profile, use the Person UID from Find Person instead.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'Next Cursor from a previous run, to get the next page. Cursors expire after 24 hours; an expired cursor means starting again from the first page.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'items',
        label: 'List Person Certifications',
        labelKey: 'title',
        listItems: [
          { key: 'title', label: 'Title' },
          { key: 'company_name', label: 'Issuing Company' },
          {
            key: 'li_company_url',
            label: 'LinkedIn Company URL',
            format: 'url',
          },
          {
            key: 'external_certificate_link',
            label: 'Certificate Link',
            format: 'url',
          },
          { key: 'issued_date', label: 'Issued Date' },
          { key: 'credential_id', label: 'Credential ID' },
          { key: 'expiration_date', label: 'Expiration Date' },
          { key: 'extracted_at', label: 'Extracted At', format: 'datetime' },
        ],
      },
      { key: 'next_cursor', label: 'Next Cursor' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  async run({ auth, propsValue }) {
    const lookup = captainDataUtils.personLookupParams({
      peopleUid: propsValue.people_uid,
      liProfileUrl: propsValue.li_profile_url,
    });
    return captainDataClient.getList({
      apiKey: auth.props.apiKey,
      path: '/people/certifications',
      operation: 'list person certifications',
      queryParams: {
        ...lookup,
        cursor: captainDataUtils.optionalText({ value: propsValue.cursor }),
      },
      retryTransientNotFound: 'li_profile_url' in lookup,
      invalidInputHint:
        'li_profile_url' in lookup ? PROFILE_URL_NOT_FOUND_HINT : undefined,
    });
  },
});
