import { createTrigger, TriggerStrategy, StoreScope, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { dubAuth } from '../..';

export const newClick = createTrigger({
  name: 'new_click',
  auth: dubAuth,
  displayName: 'New Click',
  description: 'Triggers when a link receives new clicks (polls analytics)',
  type: TriggerStrategy.POLLING,
  props: {
    link_id: Property.ShortText({ displayName: 'Link ID', required: true }),
  },
  async onEnable({ store }) {
    await store.put('lastClicks', 0, StoreScope.FLOW);
  },
  async onDisable({ store }) {
    await store.delete('lastClicks', StoreScope.FLOW);
  },
  async run({ auth, propsValue, store }) {
    const lastClicks = await store.get<number>('lastClicks', StoreScope.FLOW) || 0;
    const params = new URLSearchParams({ linkId: propsValue.link_id, interval: '24h' });
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.dub.co/analytics?${params}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    const currentClicks = (response.body as any)?.clicks || 0;
    await store.put('lastClicks', currentClicks, StoreScope.FLOW);
    if (currentClicks > lastClicks) {
      return [{ link_id: propsValue.link_id, new_clicks: currentClicks - lastClicks, total_clicks: currentClicks }];
    }
    return [];
  },
  sampleData: { link_id: 'link_123', new_clicks: 5, total_clicks: 42 },
});
