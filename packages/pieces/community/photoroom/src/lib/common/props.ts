import { Property } from '@activepieces/pieces-framework';

function outputFilename() {
  return Property.ShortText({
    displayName: 'Generated filename',
    description:
      'Name of the output file, including its extension (for example result.png).',
    required: true,
  });
}

function exportFormat() {
  return Property.StaticDropdown({
    displayName: 'Export Format',
    description: 'Format of the result image. Defaults to PNG.',
    required: false,
    options: {
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'JPG', value: 'jpg' },
        { label: 'WebP', value: 'webp' },
        { label: 'AVIF', value: 'avif' },
      ],
    },
  });
}

export const photoroomProps = {
  outputFilename,
  exportFormat,
};
