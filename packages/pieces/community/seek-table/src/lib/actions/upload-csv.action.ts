import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { seekTableAuth } from '../../lib/common/auth';
import { seekTableProps } from '../../lib/common/props';

export const uploadCsvAction = createAction({
  auth: seekTableAuth,
  name: 'upload_csv',
  displayName: 'Upload CSV File',
  description: 'Uploads a CSV file and creates new or refreshes existing CSV cube.',
  audience: 'both',
  aiMetadata: { description: 'Uploads a CSV file (plain or gzip/zip-compressed) to SeekTable to back a cube. Operates in two modes: pass an existing cube id to refresh that CSV cube with the new data, or omit it to create a brand-new cube. Use when an agent needs to load tabular data into SeekTable before reporting on it. Not idempotent — each call ingests the file, creating a new cube or re-importing data into the targeted one.', idempotent: false },
  props: {
    cubeId: seekTableProps.cubeId,
    filename: seekTableProps.filename,
    csvFile: seekTableProps.csvFile,
  },
  async run(context) {
    const { cubeId, filename, csvFile } = context.propsValue;

    let url = 'api/cube/import/csv';
    const queryParams = new URLSearchParams();

    if (cubeId) {
      queryParams.append('cubeId', cubeId);
    }

    if (filename) {
      queryParams.append('filename', filename);
    }

    if (queryParams.toString()) {
      url += '?' + queryParams.toString();
    }

    const formData = new FormData();

    if (csvFile?.data && csvFile?.filename) {
      formData.append('file', csvFile.data, csvFile.filename);
    } else {
      throw new Error('CSV file is required');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    return response.body;
  },
});
