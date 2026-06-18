import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { olostepAuth } from '../auth';

type OlostepSearchResponse = {
  data?: {
    result?: {
      links?: Array<{
        url: string;
        title: string;
        description: string;
      }>;
    };
  };
};

export const searchWeb = createAction({
  auth: olostepAuth,
  name: 'searchWeb',
  displayName: 'Search Web',
  description: 'Search the web via Olostep and return ranked links.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query to send to Olostep.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const apiKey = (auth as any)?.secret_text ?? (auth as any) ?? '';
    const response = await httpClient.sendRequest<OlostepSearchResponse>({
      method: HttpMethod.POST,
      url: 'https://api.olostep.com/v1/searches',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        query: propsValue.query,
      },
    });

    return {
      links: response.body.data?.result?.links ?? [],
    };
  },
});
