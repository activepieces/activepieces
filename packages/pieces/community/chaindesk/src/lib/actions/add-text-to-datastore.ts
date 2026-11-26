import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { chaindeskAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withUsageLimitHint } from '../common/errors';
import { datastoreIdDropdown } from '../common/props';

export const addTextToDatastoreAction = createAction({
  auth: chaindeskAuth,
  name: 'add-text-to-datastore',
  displayName: 'Add Text to Datastore',
  description: 'Adds a block of text as a new datasource in a datastore.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds plain text as a new datasource in a specific Chaindesk (Askli) datastore so agents and datastore search can use it. Returns the datasource with its ID and sync status; ingestion is asynchronous, so check it with Get Datasource. Not idempotent: each call creates another datasource.',
    idempotent: false,
  },
  props: {
    datastoreId: datastoreIdDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A name for this datasource, shown in the datastore.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
  },
  outputSchema: chaindeskOutputSchemas.datasource,
  async run(context) {
    const { datastoreId, name, text } = context.propsValue;
    if (!text.trim()) {
      throw new Error('Text cannot be empty.');
    }
    if (!name.trim()) {
      throw new Error('Name cannot be empty.');
    }
    const response = await withUsageLimitHint(() =>
      httpClient.sendRequest({
        method: HttpMethod.POST,
        url: BASE_URL + '/datasources',
        redactBodyInErrors: true,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
        body: {
          type: 'text',
          datastoreId,
          name: name.trim(),
          datasourceText: text,
        },
      })
    );
    return response.body;
  },
});
