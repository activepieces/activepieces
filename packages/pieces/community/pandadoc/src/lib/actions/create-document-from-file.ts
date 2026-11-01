import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocFiles } from '../common/files';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const createDocumentFromFile = createAction({
  auth: pandadocAuth,
  name: 'create_document_from_file',
  classification: 'WRITE',
  displayName: 'Create Document from File',
  description: 'Creates a document from a PDF (or DOCX) file or a public file URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a PandaDoc document from a PDF/DOCX file or public URL, with recipients. If the PDF has PandaDoc field tags, every tag must get a value in Field Values (keyed by tag name) and recipient roles must match the tag roles; set Parse Form Fields for PDFs with fillable form fields instead. By default waits until the document is ready to send. Not idempotent: each call creates a new document.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Document Name', required: true }),
    file: Property.File({ displayName: 'File', description: 'A PDF or DOCX file. Used instead of File URL when both are set.', required: false }),
    url: Property.ShortText({ displayName: 'File URL', description: 'Public URL of a PDF or DOCX file.', required: false }),
    recipients: pandadocAiProps.recipients({ required: true }),
    fields: pandadocAiProps.fieldValues(),
    parse_form_fields: Property.Checkbox({
      displayName: 'Parse Form Fields',
      description: 'Turn on for PDFs with fillable form fields; leave off for PDFs with PandaDoc field tags.',
      required: false,
      defaultValue: false,
    }),
    folder_id: Property.ShortText({ displayName: 'Folder ID', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    metadata: Property.Object({ displayName: 'Metadata', required: false }),
    wait_until_ready: pandadocAiProps.waitUntilReady(),
  },
  outputSchema: pandadocSchemas['createdDocument'],
  async run({ auth, propsValue }) {
    const fields = pandadocInputs.fieldValues(propsValue.fields);
    const tags = pandadocInputs.stringList(propsValue.tags);
    const metadata = pandadocInputs.stringRecord(propsValue.metadata);
    const folderId = pandadocInputs.optionalString(propsValue.folder_id);
    const recipients = pandadocInputs.recipients(propsValue.recipients);
    if (recipients.length === 0) {
      throw new Error('Add at least one recipient.');
    }
    const data = {
      name: pandadocInputs.requiredString({ value: propsValue.name, label: 'Document Name' }),
      recipients,
      parse_form_fields: propsValue.parse_form_fields === true,
      ...(Object.keys(fields).length > 0 ? { fields } : {}),
      ...(folderId === undefined ? {} : { folder_uuid: folderId }),
      ...(tags.length > 0 ? { tags } : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
    const waitForDraft = propsValue.wait_until_ready !== false;
    const file = pandadocFiles.readUploadFile({ value: propsValue.file, label: 'File' });
    if (file !== undefined) {
      return pandadocApi.createDocumentFromUpload({ apiKey: auth.secret_text, file, data, waitForDraft });
    }
    const url = pandadocInputs.optionalString(propsValue.url);
    if (url === undefined) {
      throw new Error('Provide a File or a File URL.');
    }
    return pandadocApi.createDocument({ apiKey: auth.secret_text, body: { ...data, url }, waitForDraft });
  },
});
