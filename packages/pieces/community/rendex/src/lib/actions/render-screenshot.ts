import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { RENDEX_OPTIONS, rendexParams, rendexProps } from '../common/props';
import { renderScreenshotOutputSchema } from '../common/output-schemas';

export const renderScreenshot = createAction({
  auth: rendexAuth,
  name: 'render_screenshot',
  classification: 'READ',
  displayName: 'Render Screenshot',
  description: 'Render a URL, HTML or Markdown to a PNG, JPEG, WebP or PDF file, with viewport, element, wait and extraction options.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renders exactly one source (URL, HTML or Markdown) to a PNG, JPEG, WebP or PDF file and returns the stored file plus capture metadata; optionally also returns the page text (Extract Text). Fill exactly one of URL, HTML or Markdown, otherwise the call is refused. Template Data fills {{placeholders}} and only works with HTML or Markdown. Use Create Render Link for a shareable image URL instead of a file, and Extract Page Content when only the text is needed. Each call spends one Rendex credit and creates a new file, so retries render again.',
    idempotent: false,
  },
  outputSchema: renderScreenshotOutputSchema,
  props: {
    ...rendexProps.sourceProps(),
    ...rendexProps.captureProps(),
    ...rendexProps.pageProps(),
    ...rendexProps.screenshotExtraProps(),
    extract_text: rendexProps.yesNo({ displayName: 'Extract Text', description: 'Yes also returns the page content as text. Default no.' }),
    extract_format: rendexProps.choice({ displayName: 'Extract Format', description: 'Format of the extracted content when Extract Text is yes. Default Markdown.', values: RENDEX_OPTIONS.EXTRACT_FORMAT_OPTIONS }),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const source = rendexInput.sourceOf({ url: values['url'], html: values['html'], markdown: values['markdown'] });
    const extract = rendexInput.flagOf({ value: values['extract_text'], label: 'Extract Text' });
    const extractFormat = rendexInput.choiceOf({ value: values['extract_format'], label: 'Extract Format', allowed: RENDEX_OPTIONS.EXTRACT_FORMAT_VALUES });
    const delay = rendexInput.numberOf({ value: values['delay_ms'], ...RENDEX_LIMITS.DELAY });
    const page = rendexParams.pageOptions({ values });
    const body = rendexInput.compact({
      ...rendexParams.screenshotBody({ values, source }),
      ...page,
      waitForSelector: rendexInput.textOf({ value: values['wait_for_selector'], label: 'Wait For Element', maxLength: 500 }),
      delay,
      darkMode: rendexInput.flagOf({ value: values['dark_mode'], label: 'Dark Mode' }),
      blockAds: rendexInput.flagOf({ value: values['block_ads'], label: 'Block Ads' }),
      quality: rendexInput.numberOf({ value: values['quality'], ...RENDEX_LIMITS.QUALITY }),
      pdfFormat: rendexInput.choiceOf({ value: values['pdf_format'], label: 'PDF Paper Size', allowed: RENDEX_OPTIONS.PAPER_VALUES }),
      pdfLandscape: rendexInput.flagOf({ value: values['pdf_landscape'], label: 'PDF Landscape' }),
      extract,
      extractFormat: extract === true ? extractFormat : undefined,
    });
    const timeoutSeconds = typeof page['timeout'] === 'number' ? page['timeout'] : undefined;
    const { data, meta } = await rendexClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/screenshot/json',
      body,
      timeoutMs: rendexInput.renderTimeoutMs({ timeoutSeconds, delayMs: delay }),
      operation: 'render the screenshot',
    });
    const record = rendexInput.isRecord(data) ? data : {};
    const image = record['image'];
    if (typeof image !== 'string' || image === '') {
      throw new Error('Rendex could not render the screenshot: the response had no image data.');
    }
    const metadata = Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'image'));
    const extension = typeof metadata['format'] === 'string' ? metadata['format'] : String(body['format'] ?? 'png');
    const file = await context.files.write({
      fileName: `rendex-screenshot.${extension}`,
      data: Buffer.from(image, 'base64'),
    });
    return { file, ...metadata, usage: meta?.['usage'] ?? null };
  },
});

