import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteMetadataTemplateAction = createAction({
  auth: boxAuth,
  name: 'box_delete_metadata_template',
  displayName: 'Delete Metadata Template',
  description: 'Deletes a Box metadata template and all its instances.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an enterprise metadata template and removes its values from every file and folder; it can\'t be undone. Needs admin rights. Scope and template key come from List Enterprise Metadata Templates.',
    idempotent: false,
  },
  props: {
    scope: boxAiProps.metadataScope({
      required: true,
      description: '"enterprise" (or "enterprise_<id>"); global templates can\'t be deleted.',
    }),
    templateKey: boxAiProps.metadataTemplateKey({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/metadata_templates/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}/schema`,
    });
    return { deleted: true, scope: propsValue.scope, templateKey: propsValue.templateKey };
  },
});
