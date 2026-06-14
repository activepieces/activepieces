import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { filetopdfAuth } from '../common/auth';
import { filetopdfApiCall } from '../common/client';
import { CHROMIUM_OPTION_PROPS } from '../common/props';
import {
  stringifyOptions,
  buildConversionOutput,
  PdfJsonEnvelope,
} from '../common/conversion';

export const convertMarkdown = createAction({
  auth: filetopdfAuth,
  name: 'convert_markdown',
  displayName: 'Convert Markdown',
  description:
    'Render a raw Markdown string (with optional CSS) to PDF. A sensible default stylesheet is applied when no CSS is provided.',
  audience: 'both',
  aiMetadata: {
    description:
      'Renders a raw Markdown string to PDF, applying a default stylesheet when no CSS is supplied (custom CSS overrides it). Choose this when the agent holds Markdown text it generated or assembled in memory, rather than a file, URL, or HTML. Requires the Markdown content as input; rendering is deterministic with no stored side effect, so re-running on the same input is safe and idempotent.',
    idempotent: true,
  },
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown',
      description: 'The Markdown content to render.',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS',
      description: 'Optional CSS to style the rendered Markdown. Overrides the default stylesheet.',
      required: false,
    }),
    ...CHROMIUM_OPTION_PROPS,
  },
  async run(context) {
    const { markdown, css, ...rawOptions } = context.propsValue;
    const options = stringifyOptions(rawOptions);
    const body: Record<string, unknown> = { markdown, ...options };
    if (css) body['css'] = css;

    const envelope = await filetopdfApiCall<PdfJsonEnvelope>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/markdown',
      body,
    });

    return buildConversionOutput(context.files, envelope);
  },
});
