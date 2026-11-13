import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsSubmissionResult } from '../../common/types';
import { gravityformsSubmitFormOutputSchema } from '../../output-schemas';

export const submitFormAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_submit_form',
  outputSchema: gravityformsSubmitFormOutputSchema,
  displayName: 'Submit Form',
  description: 'Submits a form the way a site visitor would.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits values to a form through the full submission process: validation, spam checks, saving the entry, add-on feeds, notification emails and confirmations. Invalid values fail the action. Use Validate Submission to check values and get field validation messages without saving, or Create Entry to save an entry without feeds or emails.',
    idempotent: false,
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
    return await gravityFormsClient.request<GravityFormsSubmissionResult>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/forms/${encodeURIComponent(formId)}/submissions`,
      body: { ...inputValues, field_values: populationValues, source_page: sourcePage, target_page: targetPage },
    });
  },
});
