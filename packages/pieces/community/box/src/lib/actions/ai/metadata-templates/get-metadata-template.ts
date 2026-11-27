import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateMetadataTemplateOutputSchema } from '../../../output-schemas';

export const getMetadataTemplateAction = createAction({
  auth: boxAuth,
  name: 'box_get_metadata_template',
  outputSchema: boxCreateMetadataTemplateOutputSchema,
  displayName: 'Get Metadata Template',
  description: 'Gets a Box metadata template by scope and key.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a metadata template\'s fields, their types and options, by scope and template key (from List Enterprise Metadata Templates or List File Metadata). Use Get Metadata Template By ID when you only have its ID.',
    idempotent: true,
  },
  props: {
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties", or templateKey from List Enterprise Metadata Templates.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_templates/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}/schema`,
    });
  },
});
