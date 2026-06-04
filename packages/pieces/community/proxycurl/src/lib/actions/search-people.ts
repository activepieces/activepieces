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
    const { country, headline, summary_keywords } = context.propsValue;

    if (!country && !headline && !summary_keywords) {
      throw new Error(
        'At least one search filter must be provided: Country, Headline Keywords, or Summary Keywords.'
      );
    }

    return proxycurlApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/v2/search/person',
      query: {
        country,
        headline,
        summary_keywords,
      },
    });
  },
});
