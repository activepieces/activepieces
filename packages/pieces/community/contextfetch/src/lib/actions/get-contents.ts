import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { contextfetchAuth } from '../auth';
import { contextfetchApi } from '../common/client';
import { contentsOutputSchema } from '../output-schemas';

export const getContentsAction = createAction({
  name: 'get_contents',
  displayName: 'Get Contents',
  description: 'Fetch one or more web pages as Markdown.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the content of specific web pages by URL (up to 10) and return each as clean Markdown, optionally with the passages most relevant to a highlights query. Use when you already have exact URLs (e.g. from a prior search) and need their text rather than running a new search. Only public http(s) URLs are allowed; pages that fail to load are listed in statuses. Read-only and idempotent; costs 1 credit per page that loads.',
    idempotent: true,
  },
  auth: contextfetchAuth,
  outputSchema: contentsOutputSchema,
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Public page URLs to fetch (up to 10), e.g. https://example.com/page.',
      required: true,
    }),
    text: Property.Checkbox({
      displayName: 'Full Text',
      description: 'Return each page as Markdown.',
      required: false,
      defaultValue: true,
    }),
    highlightsQuery: Property.ShortText({
      displayName: 'Highlights Query',
      description: 'Return the page chunks most relevant to this query as highlights, e.g. "pricing".',
      required: false,
    }),
    prunedContext: Property.Checkbox({
      displayName: 'Pruned Context',
      description: 'Also return the chunks relevant to the Highlights Query joined in page order, to save tokens.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const highlightsQuery = propsValue.highlightsQuery?.trim();
    const body: Record<string, unknown> = {
      urls: propsValue.urls.map((u) => String(u).trim()).filter((u) => u.length > 0),
      text: propsValue.text ?? true,
    };
    if (highlightsQuery) body['highlights'] = { query: highlightsQuery };
    if (propsValue.prunedContext) body['prunedContext'] = true;

    return contextfetchApi.request<Record<string, unknown>>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/contents',
      body,
    });
  },
});
