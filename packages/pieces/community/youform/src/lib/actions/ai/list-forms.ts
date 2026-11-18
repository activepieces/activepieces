import { createAction } from '@activepieces/pieces-framework';

import { youformAuth } from '../../auth';
import { youformAiProps } from '../../common/ai-props';
import { youformApi } from '../../common/api';
import { youformListFormsOutputSchema } from '../../output-schemas';

export const youformListFormsAction = createAction({
  auth: youformAuth,
  name: 'youform_list_forms',
  outputSchema: youformListFormsOutputSchema,
  displayName: 'List Forms',
  description: 'Lists one page of forms in the account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists one page of the account's forms with their ID, slug, name, closed state and submission count. Use it to find the form slug that Get Form and List Submissions take. Page through with Page.",
    idempotent: true,
  },
  props: {
    page: youformAiProps.page({ required: false }),
  },
  async run(context) {
    const response = await youformApi.listForms({
      auth: context.auth,
      page: context.propsValue.page,
    });
    return {
      ...response.data,
      data: response.data.data.map((form) => ({
        id: form.id,
        slug: form.slug,
        name: form.name,
        closed: form.closed,
        submissions_count: form.submissions_count,
        created_at: form.created_at,
        updated_at: form.updated_at,
      })),
    };
  },
});
