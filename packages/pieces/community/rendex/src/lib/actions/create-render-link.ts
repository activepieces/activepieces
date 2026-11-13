import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { rendexParams, rendexProps } from '../common/props';
import { createRenderLinkOutputSchema } from '../common/output-schemas';

export const createRenderLink = createAction({
  auth: rendexAuth,
  name: 'create_render_link',
  classification: 'WRITE',
  displayName: 'Create Render Link',
  description: 'Create a signed, cached image URL that renders a URL, HTML or Markdown when it is opened, for emails, og:image tags or embeds.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a signed link that renders exactly one source (URL, HTML or Markdown) when opened and serves it from cache afterwards; use it to embed an image in an email, web page or og:image tag. Fill exactly one of URL, HTML or Markdown. Use Render Screenshot when you need the file itself. One credit is charged when the link renders (cache misses only), not when it is created. Each call signs a new link, so retries create another link.',
    idempotent: false,
  },
  outputSchema: createRenderLinkOutputSchema,
  props: {
    ...rendexProps.sourceProps(),
    ...rendexProps.captureProps(),
    ...rendexProps.pageProps(),
    expires_in_seconds: Property.Number({
      displayName: 'Expires In (seconds)',
      description: 'How long the link stays valid, 3600 (1 hour) to 2592000 (30 days). Default 30 days.',
      required: false,
    }),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const source = rendexInput.sourceOf({ url: values['url'], html: values['html'], markdown: values['markdown'] });
    const body = rendexInput.compact({
      ...rendexParams.screenshotBody({ values, source }),
      ...rendexParams.pageOptions({ values }),
      expiresIn: rendexInput.numberOf({ value: values['expires_in_seconds'], ...RENDEX_LIMITS.EXPIRES }),
    });
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/render/link',
      body,
      timeoutMs: RENDEX_LIMITS.RENDER_TIMEOUT_MS,
      operation: 'create the render link',
    });
  },
});
