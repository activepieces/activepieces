import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { shippoAuth } from '../auth';
import { ShippoClient } from '../client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof shippoAuth>,
  { test_mode?: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const client = new ShippoClient({
      apiToken: auth.secret_text,
    });

    const result = await client.listShippingLabels({
      results_per_page: 100,
    });

    let filteredLabels = result.results.filter((label) => {
      const labelTime = dayjs(label.object_created).valueOf();
      return labelTime > lastFetchEpochMS;
    });

    if (!propsValue.test_mode) {
      filteredLabels = filteredLabels.filter(
        (label) => !label.test
      );
    }

    return filteredLabels.map((label: any) => ({
      epochMilliSeconds: dayjs(label.object_created).valueOf(),
      data: label,
    }));
  },
};

export const newShippingLabel = createTrigger({
  name: 'new_shipping_label',
  displayName: 'New Shipping Label',
  description: 'Trigger when a new shipping label is created',
  type: TriggerStrategy.POLLING,
  auth: shippoAuth,
  props: {
    test_mode: Property.Checkbox({
      displayName: 'Include Test Labels',
      description: 'Include test shipping labels in the trigger',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    commercial_invoice_url: 'string',
    created_by: {
      first_name: 'Shwan',
      last_name: 'Ippotle',
      username: 'shippotle@shippo.com',
    },
    eta: 'string',
    label_file_type: 'PDF_4x6',
    label_url:
      'https://shippo-delivery.s3.amazonaws.com/70ae8117ee1749e393f249d5b77c45e0.pdf?Signature=vDw1ltcyGveVR1OQoUDdzC43BY8%3D&Expires=1437093830&AWSAccessKeyId=AKIAJTHP3LLFMYAWALIA',
    messages: [],
    metadata: 'string',
    object_created: '2019-08-24T14:15:22Z',
    object_id: '915d94940ea54c3a80cbfa328722f5a1',
    object_owner: 'shippotle@shippo.com',
    object_state: 'VALID',
    object_updated: '2019-08-24T14:15:22Z',
    parcel: 'e94c7fdfdc7b495dbb390a28d929d90a',
    qr_code_url:
      'https://shippo-delivery.s3.amazonaws.com/96_qr_code.pdf?Signature=PEdWrp0mFWAGwJp7FW3b%2FeA2eyY%3D&Expires=1385930652&AWSAccessKeyId=AKIAJTHP3LLFMYAWALIA',
    rate: {},
    status: 'SUCCESS',
    test: true,
    tracking_number: '9499907123456123456781',
    tracking_status: 'DELIVERED',
    tracking_url_provider:
      'https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=9499907123456123456781',
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
