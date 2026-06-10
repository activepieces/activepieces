import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { proxycurlAuth } from '../../index';
import { proxycurlApiCall } from '../common/client';

export const getPersonProfileAction = createAction({
  name: 'get_person_profile',
  displayName: 'Get Person Profile',
  description: 'Fetch a LinkedIn person profile from Proxycurl.',
  auth: proxycurlAuth,
  props: {
    linkedin_profile_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'Public LinkedIn profile URL, for example https://www.linkedin.com/in/williamhgates',
      required: true,
    }),
  },
  async run(context) {
    return proxycurlApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/v2/linkedin',
      query: {
        url: context.propsValue.linkedin_profile_url,
      },
    });
  },
});
