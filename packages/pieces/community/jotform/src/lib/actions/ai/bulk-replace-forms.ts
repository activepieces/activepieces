import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformBulkReplaceFormsOutputSchema } from '../../output-schemas';

export const bulkReplaceForms = createAction({
  auth: jotformAuth,
  name: 'jotform_bulk_replace_forms',
  outputSchema: jotformBulkReplaceFormsOutputSchema,
  classification: 'WRITE',
  displayName: 'Bulk Replace Forms',
  description: 'Bulk create or replace forms from a JSON array.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Bulk creates or replaces forms from a JSON array of form objects. Each entry with an existing form ID replaces that form; entries without one create a new form. Not idempotent — a call with no IDs creates new forms every time.',
    idempotent: false,
  },
  props: {
    forms: Property.Json({
      displayName: 'Forms',
      description: 'JSON array of form objects to create or replace.',
      required: true,
    }),
  },
  async run(context) {
    const { forms } = context.propsValue;
    if (!Array.isArray(forms) || forms.length === 0) {
      throw new Error('forms must be a non-empty array.');
    }
    return jotformCommon.request({
      method: HttpMethod.PUT,
      path: '/user/forms',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: { forms: JSON.stringify(forms) },
    });
  },
});
