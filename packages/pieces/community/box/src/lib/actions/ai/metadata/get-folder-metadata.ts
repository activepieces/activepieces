import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateFolderMetadataOutputSchema } from '../../../output-schemas';

const BOOLEANS = ['true', 'false'];

export const getFolderMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_get_folder_metadata',
  outputSchema: boxCreateFolderMetadataOutputSchema,
  displayName: 'Get Folder Metadata',
  description: 'Gets one metadata instance on a Box folder.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the values of one metadata template on a folder, by scope and template key (both from List Folder Metadata). Fails with 404 if the template is not on the folder.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties" for free-form, or $template from List Folder Metadata.',
    }),
    hydrated: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Hydrated Taxonomy Values',
      description: '"true" returns taxonomy field values as full taxonomy nodes instead of node IDs.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.hydrated !== undefined && !BOOLEANS.includes(propsValue.hydrated)) {
      throw new Error('Hydrated Taxonomy Values must be "true" or "false".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/metadata/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}`,
      query: { view: propsValue.hydrated === 'true' ? 'hydrated' : undefined },
    });
  },
});
