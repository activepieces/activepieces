import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { ATTACHMENT_OBJECT_TYPES } from '../common/fields';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieAttachFileFromUrlAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_attach_file_from_url',
  classification: 'WRITE',
  displayName: 'Attach File from URL',
  description: 'Attach a file from a public URL to a client, project, task, opportunity, expense or ticket.',
  audience: 'both',
  aiMetadata: {
    description:
      'Makes Moxie download a file from a public https URL and attach it to a client, project, task, opportunity, expense or ticket by id. Use to file a document, receipt or design that already lives online; the URL must be reachable by Moxie without credentials. Not idempotent: each call adds another copy of the file.',
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
      description: 'Id of the client, project, task, opportunity, expense or ticket to attach the file to.',
      required: true,
    }),
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'Public https URL of the file.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name to store the file under, including its extension.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const objectType = moxieInput.requiredText({ value: propsValue.objectType, field: 'Attach To' }).toUpperCase();
    if (!ATTACHMENT_OBJECT_TYPES.includes(objectType)) {
      throw new Error(`Attach To must be one of: ${ATTACHMENT_OBJECT_TYPES.join(', ')}.`);
    }
    const objectId = moxieInput.id({ value: propsValue.objectId, field: 'Record ID' });
    const fileUrl = moxieInput.httpsUrl({ value: propsValue.fileUrl, field: 'File URL' });
    const fileName = moxieInput.requiredText({ value: propsValue.fileName, field: 'File Name' });
    const url = await moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.POST,
      path: '/action/attachments/createFromUrl',
      query: { id: objectId, type: objectType, fileUrl, fileName },
      notFoundMessage: `No ${objectType.toLowerCase()} with id ${objectId} in this Moxie workspace.`,
    });
    return { url: typeof url === 'string' ? url : null, objectType, objectId, fileName };
  },
});
