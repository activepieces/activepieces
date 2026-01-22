import { Property } from '@activepieces/pieces-framework';
import { CloudConvertClient } from './client';
import { cloudconvertAuth } from './auth';

const outputFormatDropdown = () =>
  Property.Dropdown({
    displayName: 'Output Format',
    description: 'The target format to convert to',
    required: true,
    refreshers: ['auth'],
    auth: cloudconvertAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your CloudConvert account first',
          options: [],
        };
      }

      try {
        const client = new CloudConvertClient(auth.props);
        const formats = await client.getSupportedFormats();

        if (formats.length === 0) {
          return {
            disabled: true,
            placeholder: 'No supported formats found',
            options: [],
          };
        }

        const formatGroups: { [key: string]: Array<{ label: string; value: string }> } = {};

        formats.forEach((format: any) => {
          const group = format.meta?.group || 'Other';
          if (!formatGroups[group]) {
            formatGroups[group] = [];
          }
          formatGroups[group].push({
            label: format.output_format.toUpperCase(),
            value: format.output_format,
          });
        });

        const popularFormats = ['pdf', 'docx', 'jpg', 'png', 'mp4', 'mp3'];
        const options: Array<{ label: string; value: string }> = [];

        popularFormats.forEach(format => {
          const formatOption = formats.find((f: any) => f.output_format === format);
          if (formatOption) {
            options.push({
              label: formatOption.output_format.toUpperCase(),
              value: formatOption.output_format,
            });
          }
        });

        formats.forEach((format: any) => {
          if (!popularFormats.includes(format.output_format)) {
            options.push({
              label: format.output_format.toUpperCase(),
              value: format.output_format,
            });
          }
        });

        return {
          options: options.slice(0, 50),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error loading formats - please try again',
          options: [],
        };
      }
    },
  });



const engineDropdown = ({ required = false }: { required?: boolean }) =>
  Property.Dropdown({
    auth: cloudconvertAuth,
    displayName: 'Engine',
    description: 'Use a specific engine for the conversion',
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your CloudConvert account first',
          options: [],
        };
      }

      const engines = [
        { label: 'LibreOffice (Default)', value: 'libreoffice' },
        { label: 'Microsoft Office', value: 'office' },
        { label: 'OnlyOffice', value: 'onlyoffice' },
        { label: 'Chrome/Puppeteer', value: 'chrome' },
        { label: 'ImageMagick', value: 'imagemagick' },
        { label: 'Poppler', value: 'poppler' },
        { label: 'GraphicsMagick', value: 'graphicsmagick' },
        { label: 'FFmpeg', value: 'ffmpeg' },
        { label: 'Calibre', value: 'calibre' },
        { label: 'Pandoc', value: 'pandoc' },
        { label: '3-Heights', value: '3heights' },
        { label: 'PDFTron', value: 'pdftron' },
        { label: 'MuPDF', value: 'mupdf' },
        { label: 'Inkscape', value: 'inkscape' },
      ];

      return {
        options: engines,
      };
    },
  });

export const convertFileProps = () => ({
  import_method: Property.StaticDropdown({
    displayName: 'Import Method',
    description: 'How to import the file for conversion',
    required: true,
    options: {
      options: [
        { label: 'File Upload', value: 'upload' },
        { label: 'File URL', value: 'url' },
        { label: 'Stored File ID', value: 'stored_file' },
      ]
    },
    defaultValue: 'upload'
  }),
  file: Property.File({
    displayName: 'File',
    description: 'File to upload and convert (select from your device)',
    required: false,
  }),
  url: Property.ShortText({
    displayName: 'File URL',
    description: 'URL of the file to convert',
    required: false,
  }),
  stored_file_id: Property.ShortText({
    displayName: 'Stored File ID',
    description: 'ID of a previously stored file in Activepieces to convert',
    required: false,
  }),
  input_format: Property.StaticDropdown({
    displayName: 'Input Format',
    description: 'The format of the input file. Leave as "Auto-detect" to let CloudConvert detect automatically',
    required: false,
    options: {
      options: [
        { label: 'Auto-detect', value: 'auto' },
        { label: 'PDF', value: 'pdf' },
        { label: 'DOCX', value: 'docx' },
        { label: 'DOC', value: 'doc' },
        { label: 'TXT', value: 'txt' },
        { label: 'JPG', value: 'jpg' },
        { label: 'PNG', value: 'png' },
        { label: 'HTML', value: 'html' },
        { label: 'Other', value: 'other' },
      ]
    },
    defaultValue: 'auto'
  }),
  output_format: outputFormatDropdown(),
  filename: Property.ShortText({
    displayName: 'Output Filename',
    description: 'Choose a filename (including extension) for the output file',
    required: false,
    defaultValue: 'converted-file'
  }),
  engine: engineDropdown({ required: false }),
  engine_version: Property.ShortText({
    displayName: 'Engine Version',
    description: 'Use a specific engine version for the conversion',
    required: false,
  }),
  timeout: Property.Number({
    displayName: 'Timeout (seconds)',
    description: 'Timeout in seconds after which the task will be cancelled',
    required: false,
  }),
  wait_for_completion: Property.Checkbox({
    displayName: 'Wait for Completion',
    description: 'Wait for the conversion to complete before returning',
    required: true,
    defaultValue: true,
  }),
  store_file: Property.Checkbox({
    displayName: 'Store File',
    description: 'Download and store the converted file in Activepieces',
    required: false,
    defaultValue: true,
  }),
});
