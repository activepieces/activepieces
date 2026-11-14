import { ApFile, Property } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { datalabClient } from './client';
import { datalabGuards } from './guards';

const SUPPORTED_TYPES = 'PDF, Word, PowerPoint, spreadsheet, HTML, EPUB or image (PNG, JPG, WEBP, GIF, TIFF)';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odp: 'application/vnd.oasis.opendocument.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroenabled.12',
  xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  epub: 'application/epub+zip',
};

function humanProps({ noun, fileTypes = SUPPORTED_TYPES }: { noun: string; fileTypes?: string }) {
  return {
    source: Property.StaticDropdown<DatalabSourceType, true>({
      displayName: `${capitalize(noun)} Source`,
      description: `Choose File to use a file from a previous step, or URL to give a public link to the ${noun}.`,
      display: 'cards',
      required: true,
      defaultValue: 'file',
      options: {
        options: [
          { label: 'File', value: 'file', description: 'A file from a previous step, up to 200 MB.', icon: 'paperclip' },
          { label: 'URL', value: 'url', description: 'A public link that Datalab downloads itself.', icon: 'code' },
        ],
      },
    }),
    document: Property.DynamicProperties({
      auth: datalabAuth,
      displayName: capitalize(noun),
      required: true,
      refreshers: ['source'],
      props: async (propsValue) => (propsValue['source'] === 'url' ? urlInputProps({ noun }) : fileInputProps({ noun, fileTypes })),
    }),
  };
}

function fileInputProps({ noun, fileTypes }: { noun: string; fileTypes: string }) {
  return {
    file: Property.File({
      displayName: 'File',
      description: `The ${noun} to process: ${fileTypes}. Pick the file output of a previous step.`,
      required: true,
    }),
  };
}

function urlInputProps({ noun }: { noun: string }) {
  return {
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: `A public link to the ${noun} that starts with http:// or https://, for example https://example.com/files/invoice.pdf. Datalab downloads it directly, so it must open without a login.`,
      placeholder: 'https://example.com/files/invoice.pdf',
      required: true,
    }),
  };
}

function aiProps({ noun, fileTypes = SUPPORTED_TYPES }: { noun: string; fileTypes?: string }) {
  return {
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: `Public http:// or https:// link to the ${noun} (${fileTypes}). Datalab downloads it directly, so it must open without a login. Links that redirect and signed links work.`,
      required: true,
    }),
  };
}

function fromHuman({ source, input, noun }: { source: unknown; input: unknown; noun: string }): DatalabSource {
  const values = datalabGuards.record(input) ?? {};
  if (source === 'url') {
    return fromUrl({ fileUrl: values['file_url'], emptyMessage: `Give the File URL, a public link to the ${noun}, or switch ${capitalize(noun)} Source to File.` });
  }
  const file = values['file'];
  if (!isFile(file)) {
    throw new Error(`Pick the ${noun} file to process, or switch ${capitalize(noun)} Source to URL. If the file comes from a previous step, check that the step returned a file.`);
  }
  return { type: 'file', filename: fileName(file), data: file.data };
}

function fromAi({ fileUrl, noun }: { fileUrl: unknown; noun: string }): DatalabSource {
  return fromUrl({ fileUrl, emptyMessage: `Give file_url, a public http:// or https:// link to the ${noun}.` });
}

function appendTo({ form, source }: { form: FormData; source: DatalabSource }): void {
  if (source.type === 'url') {
    form.append('file_url', source.url);
    return;
  }
  form.append('file', new Blob([new Uint8Array(source.data)], { type: mimeType(source.filename) }), source.filename);
}

function newForm({ source, fields }: { source: DatalabSource; fields: Parameters<typeof datalabClient.appendFields>[0]['fields'] }): FormData {
  const form = new FormData();
  appendTo({ form, source });
  datalabClient.appendFields({ form, fields });
  return form;
}

function fromUrl({ fileUrl, emptyMessage }: { fileUrl: unknown; emptyMessage: string }): DatalabSource {
  const url = datalabGuards.text(fileUrl)?.trim();
  if (url === undefined) {
    throw new Error(emptyMessage);
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`The File URL must start with http:// or https://. Got "${url.slice(0, 80)}".`);
  }
  return { type: 'url', url };
}

function isFile(value: unknown): value is ApFile {
  return datalabGuards.isRecord(value) && Buffer.isBuffer(value['data']) && value['data'].length > 0;
}

function fileName(file: ApFile): string {
  const name = datalabGuards.text(file.filename)?.trim() ?? 'document';
  const extension = datalabGuards.text(file.extension)?.replace(/^\./, '').toLowerCase();
  if (extension === undefined || name.toLowerCase().endsWith(`.${extension}`)) {
    return name;
  }
  return /\.[A-Za-z0-9]{1,5}$/.test(name) ? name : `${name}.${extension}`;
}

function mimeType(filename: string): string {
  const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.') + 1).toLowerCase() : '';
  return MIME_TYPES[extension] ?? 'application/octet-stream';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const datalabSource = { SUPPORTED_TYPES, humanProps, aiProps, fileInputProps, urlInputProps, fromHuman, fromAi, appendTo, newForm, mimeType };

export type DatalabSourceType = 'file' | 'url';

export type DatalabSource = { type: 'file'; filename: string; data: Buffer } | { type: 'url'; url: string };
