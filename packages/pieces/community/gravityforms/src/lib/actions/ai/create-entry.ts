import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsEntry } from '../../common/types';
import { gravityformsCreateEntryOutputSchema } from '../../output-schemas';

export const createEntryAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_create_entry',
  outputSchema: gravityformsCreateEntryOutputSchema,
  displayName: 'Create Entry',
  description: 'Saves an entry directly, without validation, feeds or notifications.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Saves an entry on a form exactly as given: no validation, add-on feeds, notification emails or confirmations run. Use Submit Form to go through the normal submission process instead. Form ids come from List Forms, field ids from Get Form.',
    idempotent: false,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
    fieldValues: gravityFormsAiProps.fieldValues({ required: true }),
    entryProperties: gravityFormsAiProps.entryProperties({ required: false }),
  },
  async run(context) {
    const { formId, fieldValues, entryProperties } = context.propsValue;
    return await gravityFormsClient.request<GravityFormsEntry>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/entries',
      body: { ...entryProperties, ...fieldValues, form_id: formId },
    });
  },
});
