import { createAction, Property } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { encodeSegment } from '../common/client';
import { entryPath } from '../common/entries';
import { fetchCognitoFile } from '../common/files';
import { entryIdText, formIdText } from '../common/props';
import { fileOutputSchema } from '../output-schemas';

export const getEntryDocumentAction = createAction({
  auth: cognitoFormsAuth,
  name: 'get_entry_document',
  classification: 'READ',
  displayName: 'Get Entry Document',
  description: 'Generates a document (PDF or Word) for an entry from one of the form\'s document templates.',
  audience: 'both',
  aiMetadata: {
    description: 'Generates the document for one Cognito Forms entry using a template number (1 is the form\'s first document template) and returns it as a file. Needs a plan with document templates. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: fileOutputSchema,
  props: {
    form_id: formIdText,
    entry_id: entryIdText('The entry number (for example 12) or the full entry ID (for example 5-12).'),
    template_number: Property.Number({
      displayName: 'Template Number',
      description: 'The document template number (the first template is 1).',
      required: true,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { form_id, entry_id, template_number } = context.propsValue;
    if (!Number.isInteger(template_number) || template_number < 1) {
      throw new Error('Template Number must be a whole number of 1 or more.');
    }
    return fetchCognitoFile({
      apiKey: context.auth.secret_text,
      path: `${entryPath({ formId: form_id, entryId: entry_id })}/documents/${encodeSegment(template_number)}`,
      files: context.files,
      fallbackName: `entry-${entry_id}-document-${template_number}.pdf`,
    });
  },
});
