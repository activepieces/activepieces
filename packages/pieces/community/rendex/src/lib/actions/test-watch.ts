import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { rendexParams, rendexProps } from '../common/props';
import { testWatchOutputSchema } from '../common/output-schemas';

export const testWatch = createAction({
  auth: rendexAuth,
  name: 'test_watch',
  classification: 'READ',
  displayName: 'Test Watch Settings',
  description: 'Dry-run watch settings on a page to see whether it can be captured, without creating a watch.',
  audience: 'both',
  aiMetadata: {
    description:
      'Dry-runs watch settings against a page without creating anything: reports whether the page is reachable and readable, with a screenshot link and the extracted text, or the reason it cannot be monitored. Use it before Create Watch. Costs one Rendex credit, refunded when the page is unreadable; changes nothing, so retries only spend credits.',
    idempotent: true,
  },
  outputSchema: testWatchOutputSchema,
  props: {
    url: Property.ShortText({ displayName: 'Page URL', description: 'The public page to test, like https://example.com/pricing.', required: true }),
    ...rendexProps.watchSettingProps(),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const { settings, renderParams } = rendexParams.watchSettings({ values });
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/watches/test',
      body: rendexInput.compact({
        url: rendexParams.watchUrlOf({ value: values['url'] }),
        ...settings,
        renderParams: Object.keys(renderParams).length === 0 ? undefined : renderParams,
      }),
      timeoutMs: RENDEX_LIMITS.RENDER_TIMEOUT_MS,
      operation: 'test the watch settings',
    });
  },
});
