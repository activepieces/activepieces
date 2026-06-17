import { createAction, Property } from '@activepieces/pieces-framework';
import { polydocAuth } from '../common/auth';
import { buildRequestBody } from '../common/build-request-body';
import { extractApiErrorMessage, polyDocRequest, resolveAuth } from '../common/client';
import { IMAGE_TYPES, SCREENSHOT_OUTPUT_ENCODINGS } from '../common/constants';
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

export const captureScreenshot = createAction({
  auth: polydocAuth,
  name: 'capture_screenshot',
  displayName: 'Capture Screenshot',
  description: 'Capture a screenshot of a URL, inline HTML, or a saved template.',
  aiMetadata: {
    description:
      'Captures a screenshot (PNG, JPEG, or WebP) of a URL, an inline HTML string, or a saved PolyDoc template. Supports full-page capture, custom viewport, and base64 or file output. Idempotent: the same input yields the same image.',
    idempotent: true,
  },
  props: {
    sourceType: sourceTypeProp('url'),
    source: sourceProp,
    templateData: templateDataProp,
    imageType: Property.StaticDropdown({
      displayName: 'Image Type',
      required: false,
      defaultValue: 'png',
      options: { disabled: false, options: IMAGE_TYPES.map((t) => ({ label: t, value: t })) },
    }),
    fullPage: Property.Checkbox({
      displayName: 'Full Page',
      description: 'Capture the entire scrollable page.',
      required: false,
      defaultValue: false,
    }),
    quality: Property.Number({
      displayName: 'Quality',
      description: 'Compression quality for JPEG/WebP (0 to 100).',
      required: false,
    }),
    viewportWidth: Property.Number({
      displayName: 'Viewport Width',
      description: 'Viewport width in CSS pixels.',
      required: false,
    }),
    viewportHeight: Property.Number({
      displayName: 'Viewport Height',
      description: 'Viewport height in CSS pixels.',
      required: false,
    }),
    devicePixelRatio: Property.Number({
      displayName: 'Device Pixel Ratio',
      description: 'Device pixel ratio, e.g. 2 for retina (0 to 10).',
      required: false,
    }),
    outputEncoding: Property.StaticDropdown({
      displayName: 'Output',
      description: 'Return the image as a file (default) or as a base64 string.',
      required: false,
      defaultValue: 'binaryFile',
      options: {
        disabled: false,
        options: SCREENSHOT_OUTPUT_ENCODINGS.map((o) => ({ label: o.label, value: o.value })),
      },
    }),
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
    const base64 = props['outputEncoding'] === 'base64';
    const params: PolyDocParams = {
      operation: 'screenshot',
      ...resolveSourceParams(props),
      ...resolveMetadata(props),
      delivery: resolveDelivery(props),
      screenshotOptions: {
        imageType: props['imageType'],
        fullPage: props['fullPage'],
        quality: props['quality'],
        encoding: base64 ? 'base64' : undefined,
        viewportWidth: props['viewportWidth'],
        viewportHeight: props['viewportHeight'],
        devicePixelRatio: props['devicePixelRatio'],
      },
    };

    const request = buildRequestBody(params);
    // base64 encoding makes the API answer with JSON, never raw bytes.
    if (base64) {
      request.isBinary = false;
    }

    try {
      const response = await polyDocRequest(resolveAuth(context.auth), request);
      return await shapeOutput({
        response,
        isBinary: request.isBinary,
        files: context.files,
        operation: 'screenshot',
        filename: params.filename,
        imageType: props['imageType'] as string | undefined,
      });
    } catch (error) {
      throw new Error(extractApiErrorMessage(error) ?? (error as Error).message);
    }
  },
});
