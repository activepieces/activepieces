import { ApFile, Property } from '@activepieces/pieces-framework';

/**
 * Front only accepts attachments on a `multipart/form-data` request, as the
 * bytes of the file. A JSON request carrying a list of URLs is accepted and the
 * attachments are silently dropped, which is why this property is a list of
 * files rather than a list of strings.
 *
 * `Property.File` resolves a URL, a data URI or an uploaded file into an
 * `ApFile` before the action runs, so a link from an earlier step is still all
 * the user has to supply.
 */
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

/**
 * Front's multipart format names array entries by index, so
 * `{ to: [a, b] }` goes out as the fields `to[0]` and `to[1]`, and a nested
 * object is addressed with a second pair of brackets: `options[tag_ids][0]`.
 * Nothing is sent for a value the caller left empty, matching what the JSON
 * path already does.
 */
export function appendField(form: FormData, name: string, value: unknown): void {
  if (value === null || value === undefined) {
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
  if (value === '') {
    return;
  }
  form.append(name, String(value));
}

/**
 * Turns the JSON body an action already builds into the equivalent multipart
 * body, then adds the files. Keeping one shape for both paths means the two
 * requests cannot drift apart.
 */
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

/**
 * Drops entries whose file failed to resolve. `Property.File` returns null for
 * a URL it could not fetch - an expired signed link, most often - and sending
 * the message without that attachment beats failing the whole step.
 */
export function toApFiles(attachments: unknown): ApFile[] {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return (attachments as AttachmentEntry[])
    .map((entry) => entry?.file)
    .filter((file): file is ApFile => !!file && !!file.data);
}
