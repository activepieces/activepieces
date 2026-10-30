import { createAction } from '@activepieces/pieces-framework';

import { youformAuth } from '../../auth';
import { youformAiProps } from '../../common/ai-props';
import { youformApi } from '../../common/api';
import { youformGetFormOutputSchema } from '../../output-schemas';

export const youformGetFormAction = createAction({
  auth: youformAuth,
  name: 'youform_get_form',
  outputSchema: youformGetFormOutputSchema,
  displayName: 'Get Form',
  description: 'Gets a form by its slug, including its questions and settings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one form by slug (from List Forms), including its published questions (`fields.blocks`, whose block ids are the answer keys in List Submissions; `draft_fields` holds unpublished edits), settings, hidden fields and submission count. Returns found: false when no form has that slug.',
    idempotent: true,
  },
  props: {
    formSlug: youformAiProps.formSlug({ required: true }),
  },
  async run(context) {
    const form = await youformApi.getForm({
      auth: context.auth,
      formSlug: context.propsValue.formSlug,
    });
    return { found: form !== null, form };
  },
});
