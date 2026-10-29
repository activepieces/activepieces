import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';
import { documentDropdown, watermarkTextDropdown, customWatermarkTextInput } from '../common/dynamic-dropdowns';

export const downloadDocument = createAction({
  auth: pandadocAuth,
  name: 'downloadDocument',
  classification: 'READ',
  displayName: 'Download Document',
  description: 'Downloads a document as PDF (or a zip of PDFs, one per section).',
  audience: 'human',
  aiMetadata: {
    description: 'Download a PandaDoc document as a PDF file, optionally watermarked, as separate files, or as the protected (certified) copy of a completed document. Read-only.',
    idempotent: true,
  },
  props: {
    document_id: documentDropdown,
    protected_copy: Property.Checkbox({
      displayName: 'Download Protected (Completed) Copy',
      description: 'Download the certified, tamper-protected PDF of a completed document. Only works for completed documents; watermark options are ignored.',
      required: false,
      defaultValue: false,
    }),
    separate_files: Property.Checkbox({
      displayName: 'Download as Separate Files',
      description: 'Download document bundle as a zip archive of separate PDFs (1 file per section)',
      required: false,
      defaultValue: false,
    }),
    watermark_text: watermarkTextDropdown,
    custom_watermark_text: customWatermarkTextInput,
    watermark_color: Property.StaticDropdown({
      displayName: 'Watermark Color',
      description: 'Select a watermark color or use custom HEX code',
      required: false,
      options: {
        options: [
          { label: 'Red (#FF0000)', value: '#FF0000' },
          { label: 'Blue (#0000FF)', value: '#0000FF' },
          { label: 'Green (#00FF00)', value: '#00FF00' },
          { label: 'Black (#000000)', value: '#000000' },
          { label: 'Gray (#808080)', value: '#808080' },
          { label: 'Orange (#FF7F00)', value: '#FF7F00' },
          { label: 'Purple (#800080)', value: '#800080' },
          { label: 'Custom HEX Code', value: 'custom' },
        ],
      },
    }),
    custom_watermark_color: Property.ShortText({
      displayName: 'Custom Watermark Color',
      description: 'Enter a custom HEX color code (e.g., #FF5733). Only used if "Custom HEX Code" is selected above.',
      required: false,
    }),
    watermark_font_size: Property.Number({ displayName: 'Watermark Font Size', description: 'Font size of the watermark text', required: false }),
    watermark_opacity: Property.Number({ displayName: 'Watermark Opacity', description: 'Opacity of the watermark (0.0 to 1.0)', required: false }),
  },
  outputSchema: pandadocSchemas['downloadedFile'],
  async run({ auth, propsValue, files }) {
    const protectedCopy = propsValue.protected_copy === true;
    const separateFiles = propsValue.separate_files === true;
    const opacity = pandadocInputs.optionalNumber(propsValue.watermark_opacity);
    if (opacity !== undefined && (opacity < 0 || opacity > 1)) {
      throw new Error('Watermark Opacity must be between 0.0 and 1.0.');
    }
    const query = protectedCopy
      ? { separate_files: separateFiles ? true : undefined }
      : {
          separate_files: separateFiles ? true : undefined,
          watermark_text: pandadocInputs.pickCustom({ value: propsValue.watermark_text, custom: propsValue.custom_watermark_text }),
          watermark_color: pandadocInputs.pickCustom({ value: propsValue.watermark_color, custom: propsValue.custom_watermark_color }),
          watermark_font_size: pandadocInputs.optionalNumber(propsValue.watermark_font_size),
          watermark_opacity: opacity,
        };
    const result = await pandadocApi.downloadDocument({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document' }),
      protectedCopy,
      query,
    });
    return {
      file: await files.write({ fileName: result.fileName, data: result.data }),
      file_name: result.fileName,
      protected: protectedCopy,
    };
  },
});
