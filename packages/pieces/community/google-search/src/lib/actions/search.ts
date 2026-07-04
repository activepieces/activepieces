import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { googleSearchAuth } from '../auth';

export const searchAction = createAction({
  auth: googleSearchAuth,
  name: 'search',
  displayName: 'Search',
  description: 'Search for content using Vertex AI Search (searchLite).',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a query against a Google Cloud Vertex AI Search (Discovery Engine) app and returns matching results from that app\'s indexed data store. Choose this to search a private/enterprise corpus configured in Discovery Engine — not the public Google web. Requires the query text plus the connection\'s project, app, and API key; an optional user pseudo ID can be passed to improve personalization. Read-only and idempotent — the same query returns the same results without side effects.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The query text to search.',
      required: true,
    }),
    userPseudoId: Property.ShortText({
      displayName: 'User Pseudo ID',
      description:
        'A pseudonymized identifier for the user (max 128 chars). Improves personalization.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, projectId, appId } = auth.props;
    const url = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/global/collections/default_collection/engines/${appId}/servingConfigs/default_search:searchLite?key=${apiKey}`;

    const body: Record<string, unknown> = {
      query: propsValue.query,
    };

    if (propsValue.userPseudoId) {
      body['userPseudoId'] = propsValue.userPseudoId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    return response.body;
  },
});
