import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocFiles } from '../common/files';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';
import { documentDropdown } from '../common/dynamic-dropdowns';

export const createAttachment = createAction({
  auth: pandadocAuth,
  name: 'createAttachment',
  classification: 'WRITE',
  displayName: 'Create Attachment',
  description: 'Adds an attachment to a document, from a file URL or an uploaded file.',
  audience: 'human',
  aiMetadata: {
    description: 'Attach a file to an existing PandaDoc document, from a public URL or a file. Not idempotent: each call adds another attachment.',
    idempotent: false,
  },
  props: {
    document_id: documentDropdown,
    source: Property.ShortText({
      displayName: 'File URL',
      description: 'Public URL of the file to attach. Leave empty when you use the File field instead.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'A file from a previous step to attach. Used instead of the File URL when both are set.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Optional name to set for the uploaded file.',
      required: false,
    }),
  },
  outputSchema: pandadocSchemas['rawAttachment'],
  async run({ auth, propsValue }) {
    return pandadocApi.createAttachmentRaw({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document' }),
      url: pandadocInputs.optionalString(propsValue.source),
      file: pandadocFiles.readUploadFile({ value: propsValue.file, label: 'File' }),
      name: pandadocInputs.optionalString(propsValue.name),
    });
  },
});
