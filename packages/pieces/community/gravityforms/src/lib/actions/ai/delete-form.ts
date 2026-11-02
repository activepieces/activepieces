import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsDeleted, GravityFormsForm } from '../../common/types';
import { gravityformsDeleteFormOutputSchema } from '../../output-schemas';

export const deleteFormAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_delete_form',
  outputSchema: gravityformsDeleteFormOutputSchema,
  displayName: 'Delete Form',
  description: 'Moves a form to the trash, or deletes it permanently.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves a form to the trash by default, which can be restored in WordPress; Delete Permanently "true" removes it and all its entries for good. Trashing an already trashed form fails. Form ids come from List Forms.',
    idempotent: false,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
    force: gravityFormsAiProps.force({ required: false }),
  },
  async run(context) {
    const { formId, force } = context.propsValue;
    if (force === 'true') {
      return await gravityFormsClient.request<GravityFormsDeleted<GravityFormsForm>>({
        auth: context.auth,
        method: HttpMethod.DELETE,
        path: `/forms/${encodeURIComponent(formId)}`,
        query: { force: '1' },
      });
    }
    const previous = await gravityFormsClient.request<GravityFormsForm>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/forms/${encodeURIComponent(formId)}`,
    });
    return { deleted: false, previous };
  },
});
