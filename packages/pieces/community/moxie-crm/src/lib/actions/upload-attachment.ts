import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest, multipartFileBody } from '../common/client';
import { ATTACHMENT_OBJECT_TYPES } from '../common/fields';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUploadAttachmentAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_upload_attachment',
  classification: 'WRITE',
  displayName: 'Upload Attachment',
  description: 'Upload a file and attach it to a client, project, task, opportunity, expense or ticket.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads a file from the flow and attaches it to a Moxie record by id. For agents use moxie_attach_file_from_url. Not idempotent: each run adds another copy.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.attachment,
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Attach To',
      required: true,
      options: {
        disabled: false,
        options: ATTACHMENT_OBJECT_TYPES.map((type) => ({ label: type.charAt(0) + type.slice(1).toLowerCase(), value: type })),
      },
    }),
    objectId: Property.ShortText({
      displayName: 'Record ID',
      description: 'Id of the record, for example mapped from a trigger or a Search step.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const objectType = moxieInput.requiredText({ value: propsValue.objectType, field: 'Attach To' }).toUpperCase();
    if (!ATTACHMENT_OBJECT_TYPES.includes(objectType)) {
      throw new Error(`Attach To must be one of: ${ATTACHMENT_OBJECT_TYPES.join(', ')}.`);
    }
    const objectId = moxieInput.id({ value: propsValue.objectId, field: 'Record ID' });
    const file = moxieInput.file({ value: propsValue.file, field: 'File' });
    const multipart = multipartFileBody({ fieldName: 'file', filename: file.filename, data: file.data });
    const url = await moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.POST,
      path: '/action/attachments/create',
      query: { id: objectId, type: objectType },
      body: multipart.body,
      contentType: multipart.contentType,
      notFoundMessage: `No ${objectType.toLowerCase()} with id ${objectId} in this Moxie workspace.`,
    });
    return { url: typeof url === 'string' ? url : null, objectType, objectId, fileName: file.filename };
  },
});
