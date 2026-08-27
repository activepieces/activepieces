import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const fetchRenderedHtml = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_fetch_rendered_html',
  classification: 'READ',
  displayName: 'Fetch Rendered HTML',
  description: 'Loads a page in MrScraper’s stealth browser and returns rendered HTML or related output.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a JavaScript-rendered page through the stealth browser with optional Markdown, screenshot, selector waiting, geo proxy, and cookies. Choose this for rendered page content rather than prompt extraction. Safe to retry.', idempotent: true },
  props: mrscraperProperties.rendered,
  propertyGroups: [
    { key: 'request', display: 'section', label: 'Request', icon: 'send', props: ['url', 'max_retries', 'timeout', 'geo_code', 'proxy_country'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'code', props: ['html', 'markdown', 'screenshot', 'screenshot_mode'] },
  ],
  async run(context) {
    const request = mrscraperPayloads.renderedRequest(context.propsValue);
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'rendered', method: HttpMethod.POST, path: '/', queryParams: request.queryParams, body: request.body, timeout: request.timeout });
  },
});
