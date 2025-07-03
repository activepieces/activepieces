import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { googleContactsCommon } from '../common';
import { googleContactsAuth } from '../../';

export const googleContactsSearchContactsAction = createAction({
  auth: googleContactsAuth,
  name: 'search_contact',
  description: 'Search contacts in Google Contacts account.',
  displayName: 'Search Contacts',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: `The plain-text query for the request.The query is used to match prefix phrases of the fields on a person. For example, a person with name "foo name" matches queries such as "f", "fo", "foo", "foo n", "nam", etc., but not "oo n".`,
      required: true,
    }),
    readMask: Property.StaticMultiSelectDropdown({
      displayName: 'Read Mask',
      description:
        'A field mask to restrict which fields on each person are returned.',
      required: true,
      options: {
        options: [
          { label: 'addresses', value: 'addresses' },
          { label: 'ageRanges', value: 'ageRanges' },
          { label: 'biographies', value: 'biographies' },
          { label: 'birthdays', value: 'birthdays' },
          { label: 'calendarUrls', value: 'calendarUrls' },
          { label: 'clientData', value: 'clientData' },
          { label: 'coverPhotos', value: 'coverPhotos' },
          { label: 'emailAddresses', value: 'emailAddresses' },
          { label: 'events', value: 'events' },
          { label: 'externalIds', value: 'externalIds' },
          { label: 'genders', value: 'genders' },
          { label: 'imClients', value: 'imClients' },
          { label: 'interests', value: 'interests' },
          { label: 'locales', value: 'locales' },
          { label: 'locations', value: 'locations' },
          { label: 'memberships', value: 'memberships' },
          { label: 'metadata', value: 'metadata' },
          { label: 'miscKeywords', value: 'miscKeywords' },
          { label: 'names', value: 'names' },
          { label: 'nicknames', value: 'nicknames' },
          { label: 'occupations', value: 'occupations' },
          { label: 'organizations', value: 'organizations' },
          { label: 'phoneNumbers', value: 'phoneNumbers' },
          { label: 'photos', value: 'photos' },
          { label: 'relations', value: 'relations' },
          { label: 'sipAddresses', value: 'sipAddresses' },
          { label: 'skills', value: 'skills' },
          { label: 'urls', value: 'urls' },
          { label: 'userDefined', value: 'userDefined' },
        ],
      },
      defaultValue: ['names', 'emailAddresses'],
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'The number of results to return. Maximum 30.',
      required: false,
    }),
  },
  async run(context) {
    const qs: QueryParams = {
      query: context.propsValue['query'],
      readMask: context.propsValue['readMask'].join(','),
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
