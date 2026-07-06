import { createAction, Property } from '@activepieces/pieces-framework';
import { polydocAuth } from '../common/auth';
import { buildRequestBody } from '../common/build-request-body';
import { extractApiErrorMessage, polyDocRequest } from '../common/client';
import { PAGE_FORMATS } from '../common/constants';
import { shapeOutput } from '../common/output';
import {
  advancedProp,
  deliveryModeProp,
  filenameProp,
  presignedUrlProp,
  resolveDelivery,
  resolveMetadata,
  resolveSourceParams,
  sourceProp,
  sourceTypeProp,
  tagProp,
  templateDataProp,
  timeoutProp,
  webhookOptionsProp,
  webhookUrlProp,
} from '../common/props';
import type { PolyDocParams } from '../common/types';

export const convertToPdf = createAction({
  auth: polydocAuth,
  name: 'convert_to_pdf',
  displayName: 'Convert to PDF',
  description: 'Convert HTML, a URL, or a saved template to a PDF.',
  aiMetadata: {
    description:
      'Converts a URL, an inline HTML string, or a saved PolyDoc template into a PDF and returns the file (or delivers it to cloud storage / a webhook). Use it to render documents like invoices, reports, or contracts. Idempotent: the same input yields the same PDF.',
    idempotent: true,
  },
  props: {
    sourceType: sourceTypeProp('url'),
    source: sourceProp,
    templateData: templateDataProp,
    format: Property.StaticDropdown({
      displayName: 'Page Format',
      required: false,
      defaultValue: 'A4',
      options: { disabled: false, options: PAGE_FORMATS.map((f) => ({ label: f, value: f })) },
    }),
    landscape: Property.Checkbox({ displayName: 'Landscape', required: false, defaultValue: false }),
    printBackground: Property.Checkbox({
      displayName: 'Print Background',
      description: 'Print background graphics and colors.',
      required: false,
      defaultValue: true,
    }),
    scale: Property.Number({
      displayName: 'Scale',
      description: 'Render scale (0.1 to 2).',
      required: false,
    }),
    pageRanges: Property.ShortText({
      displayName: 'Page Ranges',
      description: 'Pages to include, e.g. "1-5, 8". Empty means all pages.',
      required: false,
    }),
    outline: Property.Checkbox({
      displayName: 'Outline (Bookmarks)',
      description: 'Generate PDF bookmarks from HTML headings.',
      required: false,
      defaultValue: false,
    }),
    tagged: Property.Checkbox({
      displayName: 'Tagged (Accessible)',
      description: 'Produce a tagged, accessible PDF.',
      required: false,
      defaultValue: false,
    }),
    marginTop: Property.ShortText({
      displayName: 'Margin Top',
      description: 'Top margin with optional unit, e.g. 10mm, 1cm, 0.5in.',
      required: false,
    }),
    marginRight: Property.ShortText({ displayName: 'Margin Right', required: false }),
    marginBottom: Property.ShortText({ displayName: 'Margin Bottom', required: false }),
    marginLeft: Property.ShortText({ displayName: 'Margin Left', required: false }),
    deliveryMode: deliveryModeProp,
    presignedUrl: presignedUrlProp,
    webhookUrl: webhookUrlProp,
    webhookOptions: webhookOptionsProp,
    filename: filenameProp,
    tag: tagProp,
    timeout: timeoutProp,
    advanced: advancedProp,
  },
  async run(context) {
    const props = context.propsValue as Record<string, unknown>;
    const params: PolyDocParams = {
      operation: 'pdf',
      ...resolveSourceParams(props),
      ...resolveMetadata(props),
      delivery: resolveDelivery(props),
      pdfOptions: {
        format: props['format'],
        landscape: props['landscape'],
        printBackground: props['printBackground'],
        scale: props['scale'],
        pageRanges: props['pageRanges'],
        outline: props['outline'],
        tagged: props['tagged'],
        marginTop: props['marginTop'],
        marginRight: props['marginRight'],
        marginBottom: props['marginBottom'],
        marginLeft: props['marginLeft'],
      },
    };

    const request = buildRequestBody(params);
    try {
      const response = await polyDocRequest(context.auth, request);
      return await shapeOutput({
        response,
        isBinary: request.isBinary,
        files: context.files,
        operation: 'pdf',
        filename: params.filename,
      });
    } catch (error) {
      throw new Error(extractApiErrorMessage(error) ?? (error as Error).message);
    }
  },
});
