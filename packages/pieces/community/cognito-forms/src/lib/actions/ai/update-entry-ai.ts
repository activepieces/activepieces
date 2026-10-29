import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../../auth';
import { cognitoRequest } from '../../common/client';
import { entryPath, normalizeEntry, parseFieldsObject } from '../../common/entries';
import { entryFieldsJson, entryIdText, formIdText } from '../../common/props';
import { entryOutputSchema } from '../../output-schemas';

export const updateEntryAiAction = createAction({
  auth: cognitoFormsAuth,
  name: 'update_entry_ai',
  classification: 'WRITE',
  displayName: 'Update Entry (by IDs)',
  description: 'Updates an entry from a form ID, an entry ID and a JSON object of field values.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an existing Cognito Forms entry. Only the fields in the JSON object change; send a field as null or "" to clear it. Use "Get Form Schema" for field names. Fails for entries with a paid order. Idempotent: the same values give the same result.',
    idempotent: true,
  },
  outputSchema: entryOutputSchema,
  props: {
    form_id: formIdText,
    entry_id: entryIdText('The entry number (for example 12) or the full entry ID (for example 5-12).'),
    fields: entryFieldsJson('Field values to change, keyed by field name. Fields not listed keep their value; null or "" clears a field.'),
  },
  async run(context) {
    const { form_id, entry_id, fields } = context.propsValue;
    const body = parseFieldsObject(fields);
    if (Object.keys(body).length === 0) {
      throw new Error('Fields must contain at least one field to update.');
    }
    const entry = await cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: entryPath({ formId: form_id, entryId: entry_id }),
      body,
    });
    return normalizeEntry(entry);
  },
});
