import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiProps } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const deleteFile = createAction({
  auth: vapiAuth,
  name: 'delete_file',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete File',
  description: 'Permanently delete a file.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.file,
  props: {
    fileId: vapiProps.fileDropdown({ required: true, description: 'The file to delete.' }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.fileId, fieldName: 'File' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/file/${id}`,
      operation: 'delete file',
    });
    return vapiUtils.stripSecrets(item);
  },
});
