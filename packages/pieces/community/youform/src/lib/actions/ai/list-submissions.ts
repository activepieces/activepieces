import { createAction, Property } from '@activepieces/pieces-framework';

import { youformAuth } from '../../auth';
import { youformAiProps } from '../../common/ai-props';
import { youformApi } from '../../common/api';
import { youformListSubmissionsOutputSchema } from '../../output-schemas';

export const youformListSubmissionsAction = createAction({
  auth: youformAuth,
  name: 'youform_list_submissions',
  outputSchema: youformListSubmissionsOutputSchema,
  displayName: 'List Submissions',
  description: 'Lists one page of submissions for a form.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists one page of a form's submissions (form slug from List Forms) with each submission's ID, answers, completion state and refill-link state, oldest first unless Sort Order says otherwise. Partial only needs a Youform Pro plan; other plans get an error for it. Page through with Page using the returned `current_page` and `last_page`.",
    idempotent: true,
  },
  props: {
    formSlug: youformAiProps.formSlug({ required: true }),
    page: youformAiProps.page({ required: false }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Submissions per page, 1-100. Defaults to 20.',
      required: false,
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Order by submission time. Defaults to oldest first.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Oldest first', value: 'asc' },
          { label: 'Newest first', value: 'desc' },
        ],
      },
    }),
    isComplete: Property.StaticDropdown({
      displayName: 'Completion',
      description:
        'Complete or partial submissions only. Partial needs Pro. Unset returns all.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Complete only', value: 'true' },
          { label: 'Partial only', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    return await youformApi.listSubmissions({
      auth: context.auth,
      ...context.propsValue,
    });
  },
});
