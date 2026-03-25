import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { proxycurlAuth } from '../../index';
import { proxycurlApiCall } from '../common/client';

export const searchPeopleAction = createAction({
  name: 'search_people',
  displayName: 'Search People',
  description: 'Search for people in Proxycurl using lightweight keyword filters.',
  auth: proxycurlAuth,
  props: {
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Optional country filter, for example us, gb, or sg.',
      required: false,
    }),
    headline: Property.ShortText({
      displayName: 'Headline Keywords',
      description: 'Optional keywords expected in the person headline.',
      required: false,
    }),
    summary_keywords: Property.ShortText({
      displayName: 'Summary Keywords',
      description: 'Optional keywords expected in the summary/about section.',
      required: false,
    }),
  },
  async run(context) {
    return proxycurlApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/v2/search/person',
      query: {
        country: context.propsValue.country,
        headline: context.propsValue.headline,
        summary_keywords: context.propsValue.summary_keywords,
      },
    });
  },
});
