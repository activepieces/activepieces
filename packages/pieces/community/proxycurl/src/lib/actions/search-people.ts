import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { proxycurlAuth } from '../../index';
import { proxycurlApiCall } from '../common/client';

export const searchPeopleAction = createAction({
  name: 'search_people',
  displayName: 'Search People',
  description: 'Search for people in Proxycurl using a lightweight set of filters.',
  auth: proxycurlAuth,
  props: {
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country filter (for example us, gb, sg).',
      required: true,
    }),
    headline: Property.ShortText({
      displayName: 'Headline Keywords',
      description: 'Keywords expected in the person headline.',
      required: true,
    }),
    summary_keywords: Property.ShortText({
      displayName: 'Summary Keywords',
      description: 'Keywords expected in the summary/about section.',
      required: false,
    }),
  },
  async run(context) {
    return proxycurlApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/search/person',
      query: {
        country: context.propsValue.country,
        headline: context.propsValue.headline,
        summary: context.propsValue.summary_keywords,
      },
    });
  },
});
