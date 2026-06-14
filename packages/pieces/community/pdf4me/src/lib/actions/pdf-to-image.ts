import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

export const pdfToImageAction = createAction({
  auth: pdf4meAuth,
  name: 'pdf_to_image',
  displayName: 'Convert PDF to Image',
  description: 'Converts one or more pages of a PDF file to an image.',
  audience: 'both',
  aiMetadata: {
    description: 'Renders selected pages of a PDF as images via the PDF4me API; the page selection accepts a single page, a comma list, a range, or "all", and the output format (PNG, JPG, TIFF, BMP) and width in pixels are configurable. Use when an agent needs a rasterized image of PDF pages rather than the PDF itself; the PDF file is required. A pure transformation that is idempotent — the same input and settings always produce the same image(s) with no stored side effect.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      description: 'The PDF file to convert to an image.',
      required: true,
    }),
    pageNrs: Property.ShortText({
      displayName: 'Page Numbers',
      description:
        'Pages to convert. Examples: "1" (first page only), "1,3,5" (specific pages), "2-5" (range), "all" (every page). Defaults to the first page.',
      required: false,
      defaultValue: '1',
    }),
    imageFormat: Property.StaticDropdown({
      displayName: 'Image Format',
      description: 'The output image format.',
      required: false,
      defaultValue: 'PNG',
      options: {
        options: [
          { label: 'PNG (lossless, recommended)', value: 'PNG' },
          { label: 'JPEG (smaller file size)', value: 'JPG' },
          { label: 'TIFF', value: 'TIF' },
          { label: 'BMP', value: 'BMP' },
        ],
      },
    }),
    widthPixel: Property.Number({
      displayName: 'Width (pixels)',
      description:
        'Output image width in pixels. Height is calculated automatically to maintain the page aspect ratio.',
      required: false,
      defaultValue: 1920,
    }),
  },
  async run(context) {
    const { file, pageNrs, imageFormat, widthPixel } = context.propsValue;
    const pageSelection = pageNrs ?? '1';
    const format = imageFormat ?? 'PNG';
    const ext = format.toLowerCase();

    const response = await pdf4meCommon.callFileApi({
      apiKey: context.auth.secret_text,
      endpoint: '/api/v2/CreateImages',
      body: {
        docContent: file.data.toString('base64'),
        docname: file.filename,
        imageAction: {
          WidthPixel: widthPixel ?? 1920,
          ImageExtension: format,
        },
        pageNrs: pageSelection,
      },
    });

    const baseName = file.filename.replace(/\.pdf$/i, '');
    const fileName = pdf4meCommon.fileNameFromHeaders(
      response.headers,
      `${baseName}.${ext}`,
    );

    return {
      file_name: fileName,
      file_data_base64: Buffer.from(response.body).toString('base64'),
      image_format: ext,
      page_selection: pageSelection,
      success: true,
    };
  },
});
