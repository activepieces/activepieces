import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiApiCall, umamiCommon } from '../common';

type UmamiAuthProps = {
  base_url: string;
  auth_mode: string;
  username?: string;
  password?: string;
  api_key?: string;
};

const STORE_KEY = 'seen_referrers';

async function fetchCurrentReferrers(authProps: UmamiAuthProps, websiteId: string): Promise<string[]> {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const response = await umamiApiCall<{ x: string; y: number }[]>({
    serverUrl: authProps.base_url,
    auth: authProps,
    method: HttpMethod.GET,
    path: `/websites/${websiteId}/metrics`,
    queryParams: {
      startAt: String(thirtyDaysAgo),
      endAt: String(now),
      type: 'referrer',
      limit: '500',
    },
  });

  return response.body
    .map((item) => item.x)
    .filter((domain) => domain !== '');
}

export const newReferrerDetected = createTrigger({
  auth: umamiAuth,
  name: 'new_referrer_detected',
  displayName: 'New Referrer Detected',
  description: 'Triggers when traffic from a new referring domain is detected for the first time.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
  },
  sampleData: {
    referrer: 'news.ycombinator.com',
    visitors: 3,
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const authProps = (context.auth as unknown as { props: UmamiAuthProps }).props;
    const domains = await fetchCurrentReferrers(authProps, context.propsValue.websiteId as string);
    await context.store.put(STORE_KEY, domains);
  },

  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },

  async run(context) {
    const authProps = (context.auth as unknown as { props: UmamiAuthProps }).props;
    const websiteId = context.propsValue.websiteId as string;

    const seenDomains: string[] = (await context.store.get<string[]>(STORE_KEY)) ?? [];
    const seenSet = new Set(seenDomains);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const response = await umamiApiCall<{ x: string; y: number }[]>({
      serverUrl: authProps.base_url,
      auth: authProps,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/metrics`,
      queryParams: {
        startAt: String(thirtyDaysAgo),
        endAt: String(now),
        type: 'referrer',
        limit: '500',
      },
    });

    const currentReferrers = response.body.filter((item) => item.x !== '');
    const newReferrers = currentReferrers.filter((item) => !seenSet.has(item.x));

    if (newReferrers.length > 0) {
      const updatedDomains = [...seenDomains, ...newReferrers.map((r) => r.x)];
      await context.store.put(STORE_KEY, updatedDomains);
    }

    return newReferrers.map((item) => ({
      referrer: item.x,
      visitors: item.y,
    }));
  },

  async test(context) {
    const authProps = (context.auth as unknown as { props: UmamiAuthProps }).props;
    const domains = await fetchCurrentReferrers(authProps, context.propsValue.websiteId as string);
    return domains.slice(0, 5).map((domain) => ({ referrer: domain, visitors: 0 }));
  },
});
