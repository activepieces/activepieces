import { ApFile, Property } from '@activepieces/pieces-framework';

// Front takes attachments only on a multipart request, as the bytes of the
// file, so this is a list of files and not a list of urls. Property.File still
// accepts a url - the engine resolves it before the action runs.
export const attachmentsProperty = Property.Array({
  displayName: 'Attachments',
  description:
    'Files to attach. Each entry accepts a URL, a base64 data URI, or a file from a previous step. Front allows 25 MB across all attachments on one message.',
  required: false,
  properties: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach.',
      required: true,
    }),
  },
});

type AttachmentEntry = { file?: ApFile };

// Front names array entries by index: to[0], options[tag_ids][0].
export function appendField(form: FormData, name: string, value: unknown): void {
  if (value === null || value === undefined || value === '') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => appendField(form, `${name}[${index}]`, entry));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      appendField(form, `${name}[${key}]`, nested);
    }
    return;
  }
  form.append(name, String(value));
}

// Same fields as the JSON body, so the two paths cannot drift apart.
export function buildMultipartBody(
  fields: Record<string, unknown>,
  attachments: unknown
): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    appendField(form, name, value);
  }
  toApFiles(attachments).forEach((file, index) => {
    form.append(
      `attachments[${index}]`,
      new Blob([new Uint8Array(file.data)]),
      file.filename
    );
  });
  return form;
}

// A file the engine could not resolve is skipped, not fatal.
export function toApFiles(attachments: unknown): ApFile[] {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return (attachments as AttachmentEntry[])
    .map((entry) => entry?.file)
    .filter((file): file is ApFile => !!file && !!file.data);
}
