import { 
  createTrigger, 
  TriggerStrategy, 
  Property,
  AppConnectionValueForAuthProperty,
  StaticPropsValue
} from '@activepieces/pieces-framework';
import { billplzApi } from '../common/api';
import { billplzAuth } from '../common/auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

type BillplzAuth = AppConnectionValueForAuthProperty<typeof billplzAuth>;

const polling: Polling<BillplzAuth, StaticPropsValue<Record<string, never>>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    try {
      const response = await billplzApi.getCollections(auth.secret_text);
      const collections = response.body.collections || [];
      
      return collections.map((collection: any) => ({
        epochMilliSeconds: Date.now(),
        data: collection
      }));
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      return [];
    }
  },
};

export const getCollectionsTrigger = createTrigger({
  name: 'get_collections',
  displayName: 'Get Collections',
  description: 'Triggers when there are new collections',
  auth: billplzAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: "inbmmepb",
    title: "My First API Collection",
    logo: {
      thumb_url: null,
      avatar_url: null
    },
    split_payment: {
      email: null,
      fixed_cut: null,
      variable_cut: null,
      split_header: false
    },
    status: "active"
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});
