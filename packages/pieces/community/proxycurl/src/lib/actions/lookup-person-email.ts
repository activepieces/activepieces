import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { proxycurlAuth } from '../../index';
import { proxycurlApiCall } from '../common/client';

export const lookupPersonEmailAction = createAction({
  name: 'lookup_person_email',
  displayName: 'Lookup Person Email',
  description: 'Lookup the work email address for a LinkedIn person profile.',
  auth: proxycurlAuth,
  props: {
    linkedin_profile_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'Public LinkedIn profile URL to enrich.',
      required: true,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Optional webhook URL for async completion callbacks from Proxycurl.',
      required: false,
    }),
  },
  async run(context) {
    return proxycurlApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/linkedin/profile/email',
      query: {
        linkedin_profile_url: context.propsValue.linkedin_profile_url,
        callback_url: context.propsValue.callback_url,
      },
    });
  },
});
