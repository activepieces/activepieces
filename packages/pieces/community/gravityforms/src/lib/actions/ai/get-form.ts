import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsApi } from '../../common/api';
import { gravityformsGetFormOutputSchema } from '../../output-schemas';

export const getFormAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_get_form',
  outputSchema: gravityformsGetFormOutputSchema,
  displayName: 'Get Form',
  description: 'Gets a form with its fields, notifications and confirmations.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one form by id with its fields, notifications and confirmations. Field ids from here are the keys used by Submit Form (input_<id>), Create Entry and List Entries filters. Form ids come from List Forms.',
    idempotent: true,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
  },
  async run(context) {
    return await gravityFormsApi.getForm({ auth: context.auth, formId: context.propsValue.formId });
  },
});
