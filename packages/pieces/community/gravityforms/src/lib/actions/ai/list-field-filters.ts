import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import { gravityformsListFieldFiltersOutputSchema } from '../../output-schemas';

export const listFieldFiltersAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_list_field_filters',
  outputSchema: gravityformsListFieldFiltersOutputSchema,
  displayName: 'List Field Filters',
  description: 'Lists the keys, operators and values a form\'s entries can be filtered by.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every filter key a form supports (field ids, entry properties and meta), with the operators and choice values each accepts. Use it to build Field Filters for List Entries and Get Form Results. Form ids come from List Forms.',
    idempotent: true,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
  },
  async run(context) {
    const fieldFilters = await gravityFormsClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/forms/${encodeURIComponent(context.propsValue.formId)}/field-filters`,
      query: { _admin_labels: '1' },
    });
    return { field_filters: fieldFilters, count: fieldFilters.length };
  },
});
