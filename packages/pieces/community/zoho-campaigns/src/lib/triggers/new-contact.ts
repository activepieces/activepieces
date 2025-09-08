import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { zohoCampaignsAuth } from '../common/auth';

export const newContact = createTrigger({
  auth: zohoCampaignsAuth,
  name: 'zoho_campaigns_new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to a selected mailing list.',
  type: TriggerStrategy.POLLING,
  props: {
    listkey: Property.Dropdown({
      displayName: 'Mailing List',
      description: 'Select the mailing list to watch for new contacts',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect Zoho Campaigns first', options: [] };
        }
        const { access_token, props } = auth as OAuth2PropertyValue;
        const location = (props && props['location']) || 'zoho.com';
        const baseUrl = `https://campaigns.${location}/api/v1.1`;
        const resp = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/getmailinglists`,
          queryParams: { resfmt: 'JSON', sort: 'desc', fromindex: '1', range: '200' },
          headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
        });
        const body = resp.body as any;
        const lists: any[] = Array.isArray(body)
          ? body
          : (body?.list_of_details as any[]) || [];
        return {
          disabled: false,
          options: lists
            .map((l) => ({ label: l.listname ?? l.name ?? 'Unnamed list', value: l.listkey }))
            .filter((o) => o.value),
        };
      },
    }),
  },
  sampleData: {
    contact_email: 'john.doe@example.com',
    listkey: '3c20ad524dfa4af86216a5be13e238ed',
  },
  async onEnable({ auth, propsValue, store }) {
    await pollingHelper.onEnable(polling, { auth, propsValue, store });
  },
  async onDisable({ auth, propsValue, store }) {
    await pollingHelper.onDisable(polling, { auth, propsValue, store });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      propsValue: context.propsValue,
      store: context.store,
      files: context.files,
    });
  },
  async test({ auth, propsValue, store, files }) {
    return await pollingHelper.test(polling, { auth, propsValue, store, files });
  },
});

type Subscriber = {
  contact_email?: string;
  email?: string;
  added_time?: string;
  created_time?: string;
};

const polling: Polling<OAuth2PropertyValue, unknown> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { access_token, props } = auth;
    const location = (props && (props as any)['location']) || 'zoho.com';
    const baseUrl = `https://campaigns.${location}/api/v1.1`;

    // Best-effort recent subscribers for selected list
    const listkey = (propsValue as any).listkey as string;
    const resp = await httpClient.sendRequest<{ response?: any } | any>({
      method: HttpMethod.GET,
      url: `${baseUrl}/getlistsubscribers`,
      queryParams: {
        resfmt: 'JSON',
        listkey,
        sort: 'desc',
        fromindex: '1',
        range: '200',
      },
      headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
    });

    const body = resp.body as any;
    const items: Subscriber[] = Array.isArray(body)
      ? (body as Subscriber[])
      : (body?.contacts as Subscriber[]) || (body?.subscribers as Subscriber[]) || (body?.list_of_details as Subscriber[]) || [];

    return items.map((s) => {
      const email = s.contact_email || s.email;
      const timeStr = s.added_time || s.created_time;
      const epochMilliSeconds = timeStr ? Date.parse(timeStr) : Date.now();
      return {
        epochMilliSeconds,
        data: { ...s, contact_email: email, listkey },
      };
    });
  },
};


