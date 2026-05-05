import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { proxycurlAuth } from '../../index';
import { proxycurlApiCall } from '../common/client';

export const getCompanyProfileAction = createAction({
  name: 'get_company_profile',
  displayName: 'Get Company Profile',
  description: 'Fetch a LinkedIn company profile from Proxycurl.',
  auth: proxycurlAuth,
  props: {
    url: Property.ShortText({
      displayName: 'LinkedIn Company URL',
      description: 'LinkedIn company URL, for example https://www.linkedin.com/company/apple/',
      required: true,
    }),
  },
  async run(context) {
    return proxycurlApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/linkedin/company',
      query: {
        url: context.propsValue.url,
      },
    });
  },
});
