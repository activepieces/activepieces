import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

export const getFile = createAction({
  auth: vapiAuth,
  name: 'get_file',
  classification: 'READ',
  displayName: 'Get File',
  description: 'Get the details of a file by its ID.',
  audience: 'both',
  outputSchema: vapiOutputSchemas.file,
  aiMetadata: {
    description:
      'Returns one Vapi knowledge-base file by ID: name, original name, MIME type, size in bytes, processing status and URL. Get the ID from Find File. Read-only.',
    idempotent: true,
  },
  props: {
    fileId: Property.ShortText({ displayName: 'File ID', description: 'ID of the file.', required: true }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.fileId, fieldName: 'File ID' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/file/${id}`,
      operation: 'get file',
    });
    return vapiUtils.stripSecrets(item);
  },
});
