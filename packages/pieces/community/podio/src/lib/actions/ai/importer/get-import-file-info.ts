import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetImportFileInfoOutputSchema } from '../../../output-schemas';

export const getImportFileInfoAction = createAction({
  auth: podioAuth,
  name: 'podio_get_import_file_info',
  outputSchema: podioGetImportFileInfoOutputSchema,
  displayName: 'Get Import File Info',
  description: 'Gets the row count and columns of a file to import.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the row count and the columns (id and name) of an uploaded CSV or Excel file, the column ids that Import App Items, Import Space Contacts and Preview Import Row map to fields. The file id comes from Upload File.',
    idempotent: true,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the uploaded CSV or Excel file, from Upload File.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/importer/${propsValue.fileId}/info` });
  },
});
