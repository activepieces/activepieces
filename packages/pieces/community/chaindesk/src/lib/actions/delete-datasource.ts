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

export const deleteDatasourceAction = createAction({
  auth: chaindeskAuth,
  name: 'delete-datasource',
  displayName: 'Delete Datasource',
  description: 'Deletes a datasource and its content from its datastore.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one Chaindesk (Askli) datasource by ID, removing its content from the datastore so agents and searches no longer use it. Returns the deleted datasource. Cannot be undone. Not idempotent: deleting an already deleted ID fails.',
    idempotent: false,
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
          method: HttpMethod.DELETE,
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
      resourceName: 'datasource',
      notFoundMessage: `Datasource ${context.propsValue.datasourceId.trim()} was not found, or this API key cannot access it.`,
    });
    return response.body;
  },
});
