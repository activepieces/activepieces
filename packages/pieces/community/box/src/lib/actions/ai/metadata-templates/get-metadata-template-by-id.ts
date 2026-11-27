import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const getMetadataTemplateByIdAction = createAction({
  auth: boxAuth,
  name: 'box_get_metadata_template_by_id',
  displayName: 'Get Metadata Template By ID',
  description: 'Gets a Box metadata template by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a metadata template\'s fields, their types and options, by template ID (the id from List Enterprise Metadata Templates or Create Metadata Template). Use Get Metadata Template when you have the scope and template key instead.',
    idempotent: true,
  },
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'The template\'s id, a UUID, from List Enterprise Metadata Templates or Create Metadata Template.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_templates/${encodeURIComponent(propsValue.templateId)}`,
    });
  },
});
