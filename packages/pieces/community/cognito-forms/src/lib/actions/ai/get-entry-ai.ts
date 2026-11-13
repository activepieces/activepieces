import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../../auth';
import { cognitoRequest } from '../../common/client';
import { entryPath, normalizeEntry } from '../../common/entries';
import { entryIdText, formIdText } from '../../common/props';
import { entryOutputSchema } from '../../output-schemas';

export const getEntryAiAction = createAction({
  auth: cognitoFormsAuth,
  name: 'get_entry_ai',
  classification: 'READ',
  displayName: 'Get Entry (by IDs)',
  description: 'Gets an entry from a form ID and an entry ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Retrieves one Cognito Forms entry by form ID and entry number or ID, returning its status, dates, links and field values under "fields". Read-only and idempotent. There is no search; you need the entry ID (for example from a trigger).',
    idempotent: true,
  },
  outputSchema: entryOutputSchema,
  props: {
    form_id: formIdText,
    entry_id: entryIdText('The entry number (for example 12) or the full entry ID (for example 5-12).'),
  },
  async run(context) {
    const { form_id, entry_id } = context.propsValue;
    const entry = await cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: entryPath({ formId: form_id, entryId: entry_id }),
    });
    return normalizeEntry(entry);
  },
});
