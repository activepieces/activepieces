import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createFileMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_create_file_metadata',
  displayName: 'Create File Metadata',
  description: 'Applies a metadata template to a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a metadata template to a file with the given values. Use scope "global" and template "properties" for free-form key/value pairs, or an enterprise template from List Enterprise Metadata Templates. Fails with 409 if the template is already on the file: use Update File Metadata then.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties" for free-form, or templateKey from List Enterprise Metadata Templates.',
    }),
    values: Property.Json({
      displayName: 'Values',
      description: 'Field values keyed by the template\'s field keys, e.g. {"status": "approved"}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}`,
      body: propsValue.values,
    });
  },
});
