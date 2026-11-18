import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { rendexInput } from '../common/common';
import { RENDEX_OPTIONS, rendexParams, rendexProps } from '../common/props';
import { extractContentOutputSchema } from '../common/output-schemas';

export const extractContent = createAction({
  auth: rendexAuth,
  name: 'extract_content',
  classification: 'READ',
  displayName: 'Extract Page Content',
  description: 'Load a web page in a real browser and return its main content as Markdown, JSON or HTML, with title and excerpt.',
  audience: 'both',
  aiMetadata: {
    description:
      'Loads a public web page in a browser (JavaScript runs) and returns its main readable content as Markdown, JSON or HTML plus title, byline and excerpt; use it to read or summarise a page. Use Render Screenshot when you need an image of the page. Fails with EXTRACTION_FAILED when the page has no readable article content. Changes nothing, but each call spends one Rendex credit.',
    idempotent: true,
  },
  outputSchema: extractContentOutputSchema,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The public web page to read, like https://example.com/blog/post.',
      required: true,
    }),
    extract_format: rendexProps.choice({ displayName: 'Format', description: 'Format of the returned content. Default Markdown.', values: RENDEX_OPTIONS.EXTRACT_FORMAT_OPTIONS }),
    ...rendexProps.pageProps(),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const url = rendexInput.textOf({ value: values['url'], label: 'URL', maxLength: 2048 });
    if (url === undefined) {
      throw new Error('URL is required.');
    }
    const page = rendexParams.pageOptions({ values });
    const timeoutSeconds = typeof page['timeout'] === 'number' ? page['timeout'] : undefined;
    const { data, meta } = await rendexClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/extract',
      body: rendexInput.compact({
        url,
        extractFormat: rendexInput.choiceOf({ value: values['extract_format'], label: 'Format', allowed: RENDEX_OPTIONS.EXTRACT_FORMAT_VALUES }),
        ...page,
      }),
      timeoutMs: rendexInput.renderTimeoutMs({ timeoutSeconds, delayMs: undefined }),
      operation: 'extract the page content',
    });
    if (!rendexInput.isRecord(data)) {
      throw new Error('Rendex could not extract the page content: the response had no data object.');
    }
    return { ...data, usage: meta?.['usage'] ?? null };
  },
});
