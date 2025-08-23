import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

const STORE_KEY = 'mailchimp_new_campaign_cursor';

export const mailChimpNewCampaignTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new-campaign',
  displayName: 'New Campaign',
  description: 'Fires when a new campaign is created or sent.',
  type: TriggerStrategy.POLLING,
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Sent', value: 'sent' },
          { label: 'Save (Draft)', value: 'save' },
          { label: 'Paused', value: 'paused' },
          { label: 'Scheduled', value: 'schedule' },
        ],
      },
      defaultValue: 'any',
    }),
  },
  sampleData: {
    id: 'abc123',
    settings: { subject_line: 'Hello' },
    create_time: '2025-01-01T10:00:00+00:00',
    status: 'sent',
  },

  async onEnable() {
    /* no-op for polling*/
  },
  async onDisable() {
    /* no-op for polling*/
  },

  async run(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const lastCursor =
      (await context.store?.get<string>(STORE_KEY)) ??
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const status = (context.propsValue.status as string) || 'any';

    const url = new URL(`https://${server}.api.mailchimp.com/3.0/campaigns`);
    url.searchParams.set('since_create_time', lastCursor);
    if (status !== 'any') url.searchParams.set('status', status);

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url.toString(),
      headers: { Authorization: `OAuth ${token}` },
    });

    const list = (resp.body as any)?.campaigns ?? [];

    const newest = list
      .map((c: any) => c?.create_time)
      .filter(Boolean)
      .sort()
      .at(-1);

    if (newest) {
      await context.store?.put(STORE_KEY, newest as string);
    } else {
      await context.store?.put(STORE_KEY, new Date().toISOString());
    }

    return list;
  },
});
