import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoProps } from '../common/props';
import { hermosoLibrary } from '../common/library';

const props = {
  brand: hermosoProps.brand,
  type: hermosoLibrary.typeProp,
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof hermosoAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const items = await hermosoLibrary.list({
      apiKey: auth.secret_text,
      brand: propsValue.brand ?? undefined,
      type: propsValue.type ?? 'all',
      limit: hermosoLibrary.maxLimit,
    });
    return items.map((item) => ({ id: item.url, data: item }));
  },
};

export const newLibraryItemTrigger = createTrigger({
  auth: hermosoAuth,
  name: 'new_library_item',
  classification: 'READ',
  displayName: 'New Library Item',
  description: 'Triggers when a finished image or video lands in the brand Library.',
  aiMetadata: {
    description:
      'Fires once for each new image or video saved to a Hermoso brand Library, whether it was made in the app, by an agent or by a flow. One payload is one file with its public URL.',
  },
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {
    url: 'https://assets.hermoso.ai/sample/image-mu1bk0wu-sr1ifr.jpg',
    type: 'image',
    poster_url: null,
    model: 'Nano Banana Pro',
    file_name: 'image-mu1bk0wu-sr1ifr.jpg',
    created_at: null,
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
