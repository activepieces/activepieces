import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteFileMetadataOutputSchema } from '../../../output-schemas';

export const deleteFileMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_delete_file_metadata',
  outputSchema: boxDeleteFileMetadataOutputSchema,
  displayName: 'Delete File Metadata',
  description: 'Removes a metadata instance from a Box file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one metadata template and all its values from a file, permanently; the template itself stays. Scope and template key come from List File Metadata.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties" for free-form, or $template from List File Metadata.',
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}`,
    });
    return { deleted: true, fileId: propsValue.fileId, scope: propsValue.scope, templateKey: propsValue.templateKey };
  },
});
