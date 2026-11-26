import { createAction, Property } from '@activepieces/pieces-framework';
import { chaindeskAuth } from '../common/auth';
import { datastoreIdDropdown } from '../common/props';
import FormData from 'form-data';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withUsageLimitHint } from '../common/errors';
import { resolveFileName } from '../common/file-name';

export const uploadFileAction = createAction({
  auth: chaindeskAuth,
  name: 'upload-file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Uploads a new file to provided Datastore.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file as a new datasource into a specific Chaindesk (Askli) datastore so agents and datastore search can use its content. Returns the datasource with its ID and sync status; ingestion is asynchronous, so check it with Get Datasource until status is synched. Not idempotent: each call creates another datasource.',
    idempotent: false,
  },
  props: {
    datastoreId: datastoreIdDropdown,
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      required: false,
    }),
  },
  outputSchema: chaindeskOutputSchemas.datasource,
  async run(context) {
    const { file, filename, datastoreId } = context.propsValue;
    const fileName = resolveFileName({
      custom: filename,
      original: file.filename,
      extension: file.extension,
    });
    const formData = new FormData();
    formData.append('file', file.data, { filename: fileName });
    formData.append('type', 'file');
    formData.append('datastoreId', datastoreId);
    formData.append('fileName', fileName);

    const response = await withUsageLimitHint(() =>
      httpClient.sendRequest({
        method: HttpMethod.POST,
        url: BASE_URL + `/datasources`,
        redactBodyInErrors: true,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
        headers: {
          ...formData.getHeaders(),
        },
        body: formData,
      })
    );

    return response.body;
  },
});
