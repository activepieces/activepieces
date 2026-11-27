import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateFolderMetadataOutputSchema } from '../../../output-schemas';

const BOOLEANS = ['true', 'false'];

export const getFileMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_get_file_metadata',
  outputSchema: boxCreateFolderMetadataOutputSchema,
  displayName: 'Get File Metadata',
  description: 'Gets one metadata instance on a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the values of one metadata template on a file, by scope and template key (both from List File Metadata). Fails with 404 if the template is not on the file.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties" for free-form, or $template from List File Metadata.',
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
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}`,
      query: { view: propsValue.hydrated === 'true' ? 'hydrated' : undefined },
    });
  },
});
