import { createAction, Property } from '@activepieces/pieces-framework';
import { chaindeskAuth } from '../common/auth';
import { datastoreIdDropdown } from '../common/props';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withNotFoundHint } from '../common/errors';

export const queryDatastoretAction = createAction({
  displayName: 'Query Datastore',
  name: 'query-datastore',
  classification: 'SEARCH',
  auth: chaindeskAuth,
  description: 'Asks question to your Datastore.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a semantic search against a specific Chaindesk (Askli) datastore and returns the matching chunks, each with its text, relevance score, source and datasource ID/name. Use to retrieve knowledge-base content for a question without invoking an agent. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    datastoreId: datastoreIdDropdown,
    query: Property.LongText({
      displayName: 'Query',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Max Results',
      description:
        'Number of matching chunks to return. Empty uses the Askli default.',
      required: false,
    }),
  },
  outputSchema: chaindeskOutputSchemas.queryDatastore,
  async run(context) {
    const { query, datastoreId, topK } = context.propsValue;
    if (
      topK !== undefined &&
      topK !== null &&
      (!Number.isInteger(topK) || topK < 1)
    ) {
      throw new Error('Max Results must be a whole number of 1 or more.');
    }

    const response = await withNotFoundHint({
      request: () =>
        httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            BASE_URL + `/datastores/${encodeURIComponent(datastoreId)}/query`,
          redactBodyInErrors: true,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.auth.secret_text,
          },
          body: {
            query,
            topK: topK ?? undefined,
          },
        }),
      readOnly: true,
      resourceName: 'datastore',
      notFoundMessage: `Datastore ${datastoreId} was not found, or this API key cannot access it.`,
    });

    return response.body;
  },
});
