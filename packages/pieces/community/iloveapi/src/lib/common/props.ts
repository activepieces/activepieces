import { Property } from '@activepieces/pieces-framework';
import { UploadInput } from './client';

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
};

type ApFile = { base64: string; filename: string };

export function fileToUploadInput(file: ApFile): UploadInput {
  return { kind: 'file', file: { base64: file.base64, filename: file.filename } };
}
