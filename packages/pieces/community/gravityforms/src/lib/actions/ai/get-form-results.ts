import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import { gravityFormsUtils } from '../../common/utils';
import { gravityformsGetFormResultsOutputSchema } from '../../output-schemas';

export const getFormResultsAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_get_form_results',
  outputSchema: gravityformsGetFormResultsOutputSchema,
  displayName: 'Get Form Results',
  description: 'Gets aggregated Quiz, Poll or Survey results for a form.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets aggregated results of a Quiz, Polls or Survey form: per-field choice totals with their labels, over all entries or the ones matching Field Filters. Needs the Quiz, Polls or Survey add-on. Form ids come from List Forms.',
    idempotent: true,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
    status: gravityFormsAiProps.status({ required: false }),
    fieldFilters: gravityFormsAiProps.fieldFilters({ required: false }),
    filterMode: gravityFormsAiProps.filterMode({ required: false }),
  },
  async run(context) {
    const { formId, status, fieldFilters, filterMode } = context.propsValue;
    return await gravityFormsClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/forms/${encodeURIComponent(formId)}/results`,
      query: gravityFormsUtils.searchQuery({ status, fieldFilters, filterMode }),
    });
  },
});
