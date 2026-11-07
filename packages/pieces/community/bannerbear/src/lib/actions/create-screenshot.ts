import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient } from '../common/client';
import { bannerbearProps } from '../common/props';
import { bannerbearOutputSchemas } from '../output-schemas';

export const createScreenshotAction = createAction({
  auth: bannerbearAuth,
  name: 'create_screenshot',
  classification: 'WRITE',
  displayName: 'Create Screenshot',
  description: 'Take a screenshot of a web page (V2 API keys only).',
  audience: 'both',
  aiMetadata: {
    description:
      'Capture a screenshot of a public web page with Bannerbear. Only works with V2 API keys; V5 keys get an error. Each call starts a new capture and uses a credit.',
    idempotent: false,
  },
  outputSchema: bannerbearOutputSchemas['screenshot'],
  props: {
    url: Property.ShortText({
      displayName: 'Page URL',
      description: 'The web page to capture.',
      required: true,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Browser width in pixels. Default 1200.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Browser height in pixels. Empty = full page.',
      required: false,
    }),
    mobile: Property.Checkbox({
      displayName: 'Mobile',
      description: 'Use a mobile user agent.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Browser language code.',
      required: false,
    }),
    wait_for_completion: bannerbearProps.waitForCompletion,
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    bannerbearClient.requireVersion({ apiKey, version: 'v2', feature: 'Create Screenshot' });
    const url = propsValue.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('Page URL must start with http:// or https://.');
    }
    const body: Record<string, unknown> = { url };
    const width = toPositiveInt({ value: propsValue.width, label: 'Width' });
    const height = toPositiveInt({ value: propsValue.height, label: 'Height' });
    if (width !== undefined) body['width'] = width;
    if (height !== undefined) body['height'] = height;
    if (propsValue.mobile !== undefined) body['mobile'] = propsValue.mobile;
    if (propsValue.language) body['language'] = propsValue.language;
    const created = await bannerbearClient.request<RawScreenshot>({
      apiKey,
      method: HttpMethod.POST,
      path: '/screenshots',
      body,
    });
    const { record, timedOut } = await bannerbearClient.waitFor({
      initial: created,
      wait: propsValue.wait_for_completion !== false,
      doneStatuses: bannerbearClient.IMAGE_DONE_STATUSES,
      failedStatuses: bannerbearClient.IMAGE_FAILED_STATUSES,
      fetchLatest: () =>
        bannerbearClient.request<RawScreenshot>({
          apiKey,
          method: HttpMethod.GET,
          path: `/screenshots/${encodeURIComponent(created.uid)}`,
        }),
    });
    bannerbearClient.throwIfFailed({ status: record.status, uid: record.uid });
    return {
      uid: record.uid,
      status: record.status ?? null,
      url: record.url ?? url,
      screenshot_image_url: record.screenshot_image_url ?? null,
      width: record.width ?? null,
      height: record.height ?? null,
      mobile: record.mobile ?? null,
      self: record.self ?? null,
      created_at: record.created_at ?? null,
      timed_out: timedOut,
    };
  },
});

function toPositiveInt({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${label} must be a whole number of 1 or more.`);
  }
  return n;
}

type RawScreenshot = {
  uid: string;
  status?: string | null;
  url?: string | null;
  screenshot_image_url?: string | null;
  width?: number | null;
  height?: number | null;
  mobile?: boolean | null;
  self?: string | null;
  created_at?: string | null;
};
