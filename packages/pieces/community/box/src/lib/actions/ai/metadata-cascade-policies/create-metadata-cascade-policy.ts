import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createMetadataCascadePolicyAction = createAction({
  auth: boxAuth,
  name: 'box_create_metadata_cascade_policy',
  displayName: 'Create Metadata Cascade Policy',
  description: 'Makes a folder\'s metadata cascade down to the items inside it.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a policy that copies a folder\'s metadata instance to new items inside it, and returns its ID. The folder must already have that template (Create Folder Metadata). Existing items only get it after Apply Metadata Cascade Policy.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({
      required: true,
      description: 'Box folder ID, not the root "0", that already has the template applied.',
    }),
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties", or $template from List Folder Metadata.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/metadata_cascade_policies',
      body: {
        folder_id: propsValue.folderId,
        scope: propsValue.scope,
        templateKey: propsValue.templateKey,
      },
    });
  },
});
