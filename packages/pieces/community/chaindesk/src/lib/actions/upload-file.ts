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

export const uploadFileAction = createAction({
  auth: chaindeskAuth,
  name: 'upload-file',
  displayName: 'Upload File',
  description: 'Uploads a new file to provided Datastore.',
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
  async run(context) {
    const { file, filename, datastoreId } = context.propsValue;
    const formData = new FormData();
    formData.append('file', file.data, { filename: filename || file.filename });
    formData.append('type', 'file');
    formData.append('datastoreId', datastoreId);
    formData.append('fileName',filename || file.filename )

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + `/datasources`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,  
      },
      headers: {
        ...formData.getHeaders(),
      },
      body: formData,
    });

    return response.body;
  },
});
