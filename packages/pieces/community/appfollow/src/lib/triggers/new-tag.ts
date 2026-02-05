import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
  StaticPropsValue,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { appfollowAuth } from '../common/auth';
import { makeRequest } from '../common/client';
const props = {
  collection_id: Property.ShortText({
    displayName: 'Collection ID',
    description: 'ID of the collection',
    required: false,
  }),
};
const polling: Polling<AppConnectionValueForAuthProperty<typeof appfollowAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    if (lastItemId === undefined || lastItemId === null) {
      lastItemId = '0';
    }
    const response = await makeRequest(auth.secret_text, HttpMethod.GET, `/account/apps`);
    const tags = response.apps.tags;
    return tags.reverse().map((item: any) => ({
      id: item.id,
      data: item,
    }));
  },
};

export const newTag = createTrigger({
  auth: appfollowAuth,
  name: 'newTag',
  displayName: 'New Tag',
  description: 'Triggered when a new tag is added',
  props,
  sampleData: {
    tag: 't0021',
    tag_name: 'Satisfied user',
    category: 'User Feedback',
    id: 735517,
    apps_id: 149112,
    tag_color: '#98D304',
  },
  type: TriggerStrategy.POLLING,
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
