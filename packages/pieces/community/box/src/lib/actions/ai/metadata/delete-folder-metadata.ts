import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteFolderMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_delete_folder_metadata',
  displayName: 'Delete Folder Metadata',
  description: 'Removes a metadata instance from a Box folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one metadata template and all its values from a folder, permanently; the template itself stays. Scope and template key come from List Folder Metadata.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties" for free-form, or $template from List Folder Metadata.',
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/metadata/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}`,
    });
    return { deleted: true, folderId: propsValue.folderId, scope: propsValue.scope, templateKey: propsValue.templateKey };
  },
});
