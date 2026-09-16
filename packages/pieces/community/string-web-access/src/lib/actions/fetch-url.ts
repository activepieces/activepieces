import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stringWebAccessAuth } from '../auth';
import { describeRequestError, makeRequest } from '../common';

export const fetchUrl = createAction({
  auth: stringWebAccessAuth,
  name: 'fetch_url',
  displayName: 'Fetch URL',
  description: 'Fetch a URL and return the page as Markdown, raw content, or JSON.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one web page through String Web Access and returns it as Markdown (default), the verbatim upstream body, or a JSON envelope carrying the destination status and headers. Proxy rotation, captcha solving and JavaScript rendering happen server-side, so this succeeds on pages that rate-limit, geo-gate or refuse automated traffic. Use when you already have the exact URL; use Search Web to find one, Map Site URLs to enumerate a whole site, or Extract Data From URL for typed fields. Read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The page to fetch, for example `https://example.com/pricing`.',
      required: true,
    }),
    format: Property.StaticDropdown<'markdown' | 'raw' | 'json'>({
      displayName: 'Format',
      description: 'How the page is returned. Markdown is the best input for an AI step.',
      required: false,
      defaultValue: 'markdown',
      options: {
        disabled: false,
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'Raw', value: 'raw' },
          { label: 'JSON envelope', value: 'json' },
        ],
      },
    }),
    mainContentOnly: Property.Checkbox({
      displayName: 'Main Content Only',
      description: 'Drop navigation, headers and footers. Only affects Markdown responses.',
      required: false,
      defaultValue: false,
    }),
    executeJS: Property.Checkbox({
      displayName: 'Render JavaScript',
      description:
        'Render the page in a browser before capturing it. Turn this on when the content comes back empty. Cannot be combined with **Custom Headers**.',
      required: false,
      defaultValue: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country to route the request through, for example `US` or `DE`.',
      required: false,
    }),
    solveCaptcha: Property.Checkbox({
      displayName: 'Solve Captcha',
      description: 'Attempt to solve a captcha challenge. Turn off to fail fast instead.',
      required: false,
      defaultValue: true,
    }),
    headers: Property.Object({
      displayName: 'Custom Headers',
      description: 'Request headers to forward. Cannot be combined with **Render JavaScript**.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const body: Record<string, unknown> = {
      url: propsValue.url,
      format: propsValue.format ?? 'markdown',
    };

    if (propsValue.mainContentOnly) body['mainContentOnly'] = true;
    if (propsValue.executeJS) body['executeJS'] = true;
    if (propsValue.countryCode) body['countryCode'] = propsValue.countryCode;
    if (propsValue.solveCaptcha === false) body['solveCaptcha'] = false;
    if (propsValue.headers && Object.keys(propsValue.headers).length > 0) {
      body['headers'] = propsValue.headers;
    }

    try {
      return await makeRequest(auth.secret_text, HttpMethod.POST, '/fetch', body);
    } catch (error: any) {
      throw describeRequestError(error, 'The page could not be fetched.');
    }
  },
});
