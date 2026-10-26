import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient } from '../../common/client';
import { asanaAttachmentOutputSchema } from '../../output-schemas';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const NON_ASCII_PATTERN = /[^\x20-\x7E]/;

function buildForm({
  parent,
  file,
  url,
  name,
}: {
  parent: string;
  file: ApFile | undefined;
  url: string | undefined;
  name: string | undefined;
}): FormData {
  const link = url?.trim() ?? '';
  const label = name?.trim() ?? '';
  if ((file === undefined) === (link === '')) {
    throw new Error('Set exactly one of File or External URL: File uploads the file itself, External URL attaches a link.');
  }
  const form = new FormData();
  form.append('parent', parent);
  if (file !== undefined) {
    if (file.data.length > MAX_UPLOAD_BYTES) {
      throw new Error(`The file is ${file.data.length} bytes; Asana accepts attachments up to 100 MB (${MAX_UPLOAD_BYTES} bytes).`);
    }
    const filename = label === '' ? file.filename : label;
    form.append('file', file.data, {
      filename: NON_ASCII_PATTERN.test(filename) ? encodeURIComponent(filename) : filename,
    });
    return form;
  }
  if (!/^https?:\/\//i.test(link)) {
    throw new Error(`External URL must start with http:// or https://, got "${link}".`);
  }
  if (label === '') {
    throw new Error('Name is required with External URL: Asana needs a display name for the link.');
  }
  form.append('resource_subtype', 'external');
  form.append('url', link);
  form.append('name', label);
  return form;
}

export const asanaUploadAttachmentAction = createAction({
  auth: asanaAuth,
  name: 'upload_attachment',
  classification: 'WRITE',
  displayName: 'Upload Attachment',
  description: 'Upload a file, or attach a link, to an Asana task, project or project brief.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one attachment to a task, a project (its Key resources) or a project brief. Either upload a file (up to 100 MB; files from Dropbox, Box, Vimeo or Google Drive cannot be pulled in by URL, download them first) or attach an external link with a URL and a display name; set exactly one. Returns the new attachment with its gid, host and view/download URLs. Use List Attachments to see what is already attached. Not idempotent: every call creates another attachment, so check List Attachments before retrying.',
    idempotent: false,
  },
  outputSchema: asanaAttachmentOutputSchema,
  props: {
    parent: Property.ShortText({
      displayName: 'Parent GID',
      description:
        'Gid of the task, project or project brief to attach to. Obtain a task gid from List Project Tasks or Get Task, a project gid from List Projects.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (up to 100 MB). Leave empty when attaching an External URL.',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'External URL',
      description: 'An http(s) link to attach instead of a file. Requires Name. Leave empty when uploading a File.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Display name of the attachment. Required with External URL; for a File it replaces the file name.',
      required: false,
    }),
  },
  async run(context) {
    const { parent, file, url, name } = context.propsValue;
    const form = buildForm({ parent: parent.trim(), file: file ?? undefined, url, name });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/attachments',
      operation: 'Upload Attachment',
      query: { opt_fields: ASANA_FIELDS.attachment },
      form,
    });
  },
});
