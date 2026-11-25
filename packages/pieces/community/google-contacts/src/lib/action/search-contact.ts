import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { googleContactsCommon } from '../common';
import { googleContactsAuth } from '../auth';
import { searchContactsOutputSchema } from '../output-schemas';

export const googleContactsSearchContactsAction = createAction({
  auth: googleContactsAuth,
  name: 'search_contact',
  classification: 'SEARCH',
  description: 'Find contacts by name, email, phone number or company.',
  audience: 'human',
  aiMetadata: { description: 'Searches the authenticated Google Contacts account for people matching a plain-text query, which prefix-matches against contact fields. Use when an agent needs to find a contact or its resourceName before updating it; the query is required and a read mask selects which fields come back (max 30 results). Read-only and idempotent.', idempotent: true },
  displayName: 'Search Contacts',
  outputSchema: searchContactsOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Search Text',
      description:
        'Matches the start of any word in a name, email, phone or company.',
      placeholder: 'Jane',
      required: true,
    }),
    readMask: Property.StaticMultiSelectDropdown({
      displayName: 'Details to Return',
      description: 'Contact details included in each result.',
      required: true,
      options: {
        options: [
          { label: 'Addresses', value: 'addresses' },
          { label: 'Age Ranges', value: 'ageRanges' },
          { label: 'Notes', value: 'biographies' },
          { label: 'Birthdays', value: 'birthdays' },
          { label: 'Calendar Links', value: 'calendarUrls' },
          { label: 'Client Data', value: 'clientData' },
          { label: 'Cover Photos', value: 'coverPhotos' },
          { label: 'Email Addresses', value: 'emailAddresses' },
          { label: 'Events', value: 'events' },
          { label: 'External IDs', value: 'externalIds' },
          { label: 'Genders', value: 'genders' },
          { label: 'Chat Accounts', value: 'imClients' },
          { label: 'Interests', value: 'interests' },
          { label: 'Languages', value: 'locales' },
          { label: 'Locations', value: 'locations' },
          { label: 'Contact Labels', value: 'memberships' },
          { label: 'Metadata', value: 'metadata' },
          { label: 'Keywords', value: 'miscKeywords' },
          { label: 'Names', value: 'names' },
          { label: 'Nicknames', value: 'nicknames' },
          { label: 'Occupations', value: 'occupations' },
          { label: 'Company and Job Title', value: 'organizations' },
          { label: 'Phone Numbers', value: 'phoneNumbers' },
          { label: 'Photos', value: 'photos' },
          { label: 'Relations', value: 'relations' },
          { label: 'SIP Addresses', value: 'sipAddresses' },
          { label: 'Skills', value: 'skills' },
          { label: 'Websites', value: 'urls' },
          { label: 'Custom Fields', value: 'userDefined' },
        ],
      },
      defaultValue: ['names', 'emailAddresses'],
    }),
    pageSize: Property.Number({
      displayName: 'Max Results',
      description: 'How many contacts to return, up to 30.',
      required: false,
      display: 'stepper',
      min: 1,
      max: 30,
      step: 1,
      defaultValue: 10,
    }),
  },
  propertyGroups: [
    { key: 'search', display: 'section', label: 'Search', icon: 'filter', props: ['query'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['readMask', 'pageSize'] },
  ],
  async run(context) {
    const readMask = context.propsValue['readMask'].join(',');
    const warmUpRequest: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.GET,
      url: `${googleContactsCommon.baseUrl}:searchContacts`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: { query: '', readMask, pageSize: '1' },
    };
    await httpClient.sendRequest(warmUpRequest);
    const qs: QueryParams = {
      query: context.propsValue['query'],
      readMask,
    };
    if (context.propsValue['pageSize']) {
      qs['pageSize'] = String(context.propsValue['pageSize']);
    }
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.GET,
      url: `${googleContactsCommon.baseUrl}:searchContacts`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: qs,
    };
    return (await httpClient.sendRequest(request)).body;
  },
});
