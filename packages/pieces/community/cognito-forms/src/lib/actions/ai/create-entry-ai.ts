import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../../auth';
import { cognitoRequest } from '../../common/client';
import { formPath, normalizeEntry, parseFieldsObject } from '../../common/entries';
import { entryFieldsJson, formIdText } from '../../common/props';
import { entryOutputSchema } from '../../output-schemas';

export const createEntryAiAction = createAction({
  auth: cognitoFormsAuth,
  name: 'create_entry_ai',
  classification: 'WRITE',
  displayName: 'Create Entry (by Form ID)',
  description: 'Creates a new entry from a form ID and a JSON object of field values.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new entry (submission) in a Cognito Forms form. Call "Get Form Schema" first to learn the field names and types, then pass the values as a JSON object keyed by field name; complex fields (Name, Address, choice lists, tables) take nested objects or arrays. Not idempotent: every call creates another entry.',
    idempotent: false,
  },
  outputSchema: entryOutputSchema,
  props: {
    form_id: formIdText,
    fields: entryFieldsJson('Field values keyed by field name, for example {"Name": {"First": "Ada", "Last": "Lovelace"}, "Email": "ada@example.com"}.'),
  },
  async run(context) {
    const { form_id, fields } = context.propsValue;
    const entry = await cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${formPath(form_id)}/entries`,
      body: parseFieldsObject(fields),
    });
    return normalizeEntry(entry);
  },
});
