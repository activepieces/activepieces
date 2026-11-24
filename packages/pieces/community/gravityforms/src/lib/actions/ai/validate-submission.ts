import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsSubmissionResult } from '../../common/types';
import { gravityformsValidateSubmissionOutputSchema } from '../../output-schemas';

export const validateSubmissionAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_validate_submission',
  outputSchema: gravityformsValidateSubmissionOutputSchema,
  displayName: 'Validate Submission',
  description: 'Checks form values against the form\'s validation rules without saving anything.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Runs a form\'s validation and spam checks on the given values and returns is_valid, validation_messages keyed by field id, and is_spam. Saves no entry and sends no email or feed. Use Submit Form to actually submit.',
    idempotent: true,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
    inputValues: gravityFormsAiProps.inputValues({ required: true }),
    populationValues: gravityFormsAiProps.populationValues({ required: false }),
    sourcePage: gravityFormsAiProps.sourcePage({ required: false }),
    targetPage: gravityFormsAiProps.targetPage({ required: false }),
  },
  async run(context) {
    const { formId, inputValues, populationValues, sourcePage, targetPage } = context.propsValue;
    try {
      return await gravityFormsClient.request<GravityFormsSubmissionResult>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: `/forms/${encodeURIComponent(formId)}/submissions/validation`,
        body: { ...inputValues, field_values: populationValues, source_page: sourcePage, target_page: targetPage },
      });
    } catch (error: unknown) {
      const body = error instanceof HttpError && error.response.status === 400 ? error.response.body : undefined;
      if (typeof body === 'object' && body !== null && 'is_valid' in body) {
        return body;
      }
      throw error;
    }
  },
});
