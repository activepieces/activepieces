import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { deleteTemplateOutputSchema } from '../../output-schemas';

export const deleteTemplateAction = createAction({
  auth: parseurAuth,
  name: 'parseur_delete_template',
  outputSchema: deleteTemplateOutputSchema,
  displayName: 'Delete Template',
  description: 'Permanently deletes a template.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Parseur template; documents it matched are kept. It cannot be restored. Get the ID from List Templates.',
    idempotent: false,
  },
  props: {
    templateId: parseurAiProps.templateId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await parseurClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/template/${encodeURIComponent(propsValue.templateId)}`,
    });
    return { deleted: true, templateId: propsValue.templateId };
  },
});
