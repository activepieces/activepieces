import { APITableAuth } from '../..';
import {
  PiecePropValueSchema,
  Property,
  StaticPropsValue,
  Store,
  StoreScope,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { APITableCommon } from '../common';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

const polling: Polling<
  PiecePropValueSchema<typeof APITableAuth>,
  { datasheet: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ store, auth, propsValue: { datasheet } }) => {
    const LastTime: number =
      (await store.get('LastTime', StoreScope.FLOW)) || 0;
    await store.put('LastTime', Date.now(), StoreScope.FLOW);

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${auth.apiTableUrl.replace(
        /\/$/,
        ''
      )}/fusion/v1/datasheets/${datasheet}/records`,
      headers: {
        Authorization: 'Bearer ' + auth.token,
      },
    };

    const res = await httpClient.sendRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        pageNum: number;
        records: {
          recordId: string;
          fields: any;
          createdAt: number;
          updatedAt: number;
        }[];
        pageSize: number;
        total: number;
      };
    }>(request);

    res.body.data.records = res.body.data.records.filter(
      (record) => record.updatedAt >= LastTime
    );

    return res.body.data.records.map((record) => {
      return {
        epochMilliSeconds: record.updatedAt,
        data: record,
      };
    });
  },
};

export const ApiTableNewRecord = createTrigger({
  auth: APITableAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to a datasheet.',
  props: {
    datasheet: APITableCommon.datasheet,
  },
  sampleData: {
    fields: {
      Title: 'mhm',
      AmazingField: 'You are really looking at this?',
      'Long text': 'veeeeeeeery long text',
    },
    recordId: 'rec2T5ppW1Mal',
    createdAt: 1689772153000,
    updatedAt: 1689772153000,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet: context.propsValue.datasheet },
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet: context.propsValue.datasheet },
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet: context.propsValue.datasheet },
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet: context.propsValue.datasheet },
    });
  },
});
