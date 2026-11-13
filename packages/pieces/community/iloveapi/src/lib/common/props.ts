import { Property } from '@activepieces/pieces-framework';
import { UploadInput } from './client';
import { ILoveApiRegion } from './types';

const REGIONS: ILoveApiRegion[] = ['eu', 'us', 'fr', 'de', 'pl', 'in', 'sg'];

const regionProp = Property.StaticDropdown({
  displayName: 'Processing Region',
  description:
    'Optional. Server region where iLoveAPI processes the files. Leave empty to let iLoveAPI choose (previous behaviour).',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Europe', value: 'eu' },
      { label: 'United States', value: 'us' },
      { label: 'France', value: 'fr' },
      { label: 'Germany', value: 'de' },
      { label: 'Poland', value: 'pl' },
      { label: 'India', value: 'in' },
      { label: 'Singapore', value: 'sg' },
    ],
  },
});

const webhookUrlProp = Property.ShortText({
  displayName: 'Webhook URL',
  description:
    'Optional. Paste the URL of an iLoveAPI "Task Completed" or "Task Failed" trigger (including ?ap_secret=...) to notify that flow when this task finishes. The URL must also be registered under Webhooks in the iLoveAPI dashboard.',
  required: false,
});

export const sharedProps = {
  output_filename: Property.ShortText({
    displayName: 'Output Filename',
    description:
      'Output file name without extension. Use {date}, {n} or {filename} placeholders.',
    required: false,
  }),
  packaged_filename: Property.ShortText({
    displayName: 'Packaged ZIP Filename',
    description:
      'Name of the ZIP archive when the result contains multiple files. No extension.',
    required: false,
  }),
  region: regionProp,
  webhook_url: webhookUrlProp,
};

export function regionOf(value: unknown): ILoveApiRegion | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const region = REGIONS.find((candidate) => candidate === value);
  if (!region) {
    throw new Error(`Processing Region must be one of: ${REGIONS.join(', ')}.`);
  }
  return region;
}

export function webhookOf(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') return undefined;
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error('Webhook URL is not a valid URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Webhook URL must use https.');
  }
  return parsed.toString();
}

export function fileToUploadInput({ file, label = 'File' }: { file: unknown; label?: string }): UploadInput {
  if (file === null || typeof file !== 'object') {
    throw new Error(`${label} is required.`);
  }
  const data = readFileData(file);
  const filename: unknown = Reflect.get(file, 'filename');
  if (data === null || data.length === 0) {
    throw new Error(`${label} is empty or could not be read.`);
  }
  return {
    kind: 'file',
    file: {
      data,
      filename: typeof filename === 'string' && filename !== '' ? filename : 'file',
    },
  };
}

function readFileData(file: object): Buffer | null {
  const data: unknown = Reflect.get(file, 'data');
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const base64: unknown = Reflect.get(file, 'base64');
  if (typeof base64 === 'string' && base64 !== '') return Buffer.from(base64, 'base64');
  return null;
}

export function rowFiles({ rows, label }: { rows: unknown; label: string }): UploadInput[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row: unknown, index) => {
    const file = row !== null && typeof row === 'object' ? Reflect.get(row, 'file') : undefined;
    return fileToUploadInput({ file: file, label: `${label} row ${index + 1}` });
  });
}

const CONFORMANCE_OPTIONS = [
  { label: 'PDF/A-1b', value: 'pdfa-1b' },
  { label: 'PDF/A-1a', value: 'pdfa-1a' },
  { label: 'PDF/A-2b (recommended)', value: 'pdfa-2b' },
  { label: 'PDF/A-2u', value: 'pdfa-2u' },
  { label: 'PDF/A-2a', value: 'pdfa-2a' },
  { label: 'PDF/A-3b', value: 'pdfa-3b' },
  { label: 'PDF/A-3u', value: 'pdfa-3u' },
  { label: 'PDF/A-3a', value: 'pdfa-3a' },
];

export { CONFORMANCE_OPTIONS, regionProp, webhookUrlProp };
