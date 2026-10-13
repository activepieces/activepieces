import { ApFile, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isApFile(value: unknown): value is ApFile {
  return (
    isRecord(value) &&
    typeof value['filename'] === 'string' &&
    Buffer.isBuffer(value['data'])
  );
}

function appendField({ form, name, value }: AppendFieldParams): void {
  if (value === null || value === undefined || value === '') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      appendField({ form, name: `${name}[${index}]`, value: entry })
    );
    return;
  }
  if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      appendField({ form, name: `${name}[${key}]`, value: nested });
    }
    return;
  }
  form.append(name, String(value));
}

function resolve(attachments: unknown): ApFile[] {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments.map((entry, index) => {
    const file = isRecord(entry) ? entry['file'] : undefined;
    if (!isApFile(file)) {
      throw new Error(
        `Attachment ${
          index + 1
        } could not be read. Check that the file still exists and that any URL is reachable.`
      );
    }
    return file;
  });
}

function buildBody({ fields, files }: BuildBodyParams): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    appendField({ form, name, value });
  }
  files.forEach((file, index) => {
    form.append(`attachments[${index}]`, file.data, file.filename);
  });
  return form;
}

export const frontAttachments = {
  property: Property.Array({
    displayName: 'Attachments',
    description:
      'Files to attach. Each entry takes a URL, a base64 data URI, or a file from an earlier step. Front allows 25 MB across all attachments on one message.',
    required: false,
    properties: {
      file: Property.File({
        displayName: 'File',
        description: 'The file to attach.',
        required: true,
      }),
    },
  }),
  resolve,
  buildBody,
};

type AppendFieldParams = {
  form: FormData;
  name: string;
  value: unknown;
};

type BuildBodyParams = {
  fields: Record<string, unknown>;
  files: ApFile[];
};
