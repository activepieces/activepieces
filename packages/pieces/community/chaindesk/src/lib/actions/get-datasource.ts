import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { chaindeskAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withNotFoundHint } from '../common/errors';

export const getDatasourceAction = createAction({
  auth: chaindeskAuth,
  name: 'get-datasource',
  displayName: 'Get Datasource',
  description: 'Gets a datasource and its sync status.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets one Chaindesk (Askli) datasource by ID, including its name, type, datastore and sync status (unsynched, pending, running, synched, error, usage_limit_reached). Use after Upload File, Add Text to Datastore or Add Web Page to Datastore to check whether ingestion finished. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    datasourceId: Property.ShortText({
      displayName: 'Datasource ID',
      description: 'The ID returned when the datasource was added.',
      required: true,
    }),
  },
  outputSchema: chaindeskOutputSchemas.datasource,
  async run(context) {
    if (!context.propsValue.datasourceId.trim()) {
      throw new Error('Datasource ID cannot be empty.');
    }
    const response = await withNotFoundHint({
      request: () =>
        httpClient.sendRequest({
          method: HttpMethod.GET,
          url:
            BASE_URL +
            `/datasources/${encodeURIComponent(
              context.propsValue.datasourceId.trim()
            )}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.auth.secret_text,
          },
        }),
      readOnly: true,
      resourceName: 'datasource',
      notFoundMessage: `Datasource ${context.propsValue.datasourceId.trim()} was not found, or this API key cannot access it.`,
    });
    return response.body;
  },
});
