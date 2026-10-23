import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { printfriendlyAuth } from '../auth';
import { printfriendlyApi } from '../common/client';
import type { ConvertRequest, ConvertResponse } from '../common/types';

export const readPage = createAction({
  auth: printfriendlyAuth,
  name: 'read_page',
  classification: 'WRITE',
  displayName: 'Read Page as Markdown',
  description:
    'Fetch a public web page and return its main article as clean Markdown.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a public web page and returns its main article as clean Markdown. Use when a flow or agent needs readable page content; use Convert to Document for PDFs, Word files, or other formats. Each call consumes one document from the plan, so retries use another document.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Page URL',
      description:
        'Public http(s) URL of the page to read. Example: https://en.wikipedia.org/wiki/Eclipse',
      required: true,
    }),
    includeLinks: Property.Checkbox({
      displayName: 'Include Links',
      description:
        'Keep link and image addresses in the Markdown. When off, links keep their words and lose their addresses.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const body: ConvertRequest = {
      url: context.propsValue.url,
      output: 'markdown',
      ...(context.propsValue.includeLinks ? { include_links: true } : {}),
    };

    const response = await printfriendlyApi.call<ConvertResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: printfriendlyApi.convertPath,
      body,
    });
    return printfriendlyApi.flattenConvertResponse(response);
  },
});
