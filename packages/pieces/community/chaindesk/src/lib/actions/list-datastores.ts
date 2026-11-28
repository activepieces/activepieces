import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { chaindeskAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withSafeError } from '../common/errors';
import { ChaindeskNamedEntity } from '../common/types';

export const listDatastoresAction = createAction({
  auth: chaindeskAuth,
  name: 'list-datastores',
  displayName: 'List Datastores',
  description: 'Lists the datastores in your account.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every Chaindesk (Askli) datastore in the account with its ID, name, description and type. Use to find the datastore ID needed by Query Datastore, Upload File, Add Text to Datastore or Add Web Page to Datastore. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: chaindeskOutputSchemas.listDatastores,
  async run(context) {
    const response = await withSafeError(() =>
      httpClient.sendRequest<ChaindeskNamedEntity[]>({
        method: HttpMethod.GET,
        url: BASE_URL + '/datastores',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
      })
    );
    if (!Array.isArray(response.body)) {
      throw new Error(
        'Chaindesk returned an unexpected datastores response (expected a list).'
      );
    }
    const datastores = response.body;
    return { datastores, count: datastores.length };
  },
});
