import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { shippoAuth } from '../auth';
import { ShippoClient } from '../client';

const polling: Polling<PiecePropValueSchema<typeof shippoAuth>, { test_mode?: boolean }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const client = new ShippoClient({
      apiToken: auth,
    });

    const startDate = lastFetchEpochMS === 0
      ? dayjs().subtract(7, 'days').toISOString()
      : dayjs(lastFetchEpochMS).toISOString();

    const result = await client.listShippingLabels({
      object_created_gt: startDate,
      results_per_page: 100,
    });

    let labels = result.results;
    if (!propsValue.test_mode) {
      labels = labels.filter(label => !label.test);
    }

    return labels.map((label: any) => ({
      epochMilliSeconds: dayjs(label.object_created || label.created_at).valueOf(),
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
      displayName: 'Test Mode',
      description: 'Include test labels',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    "object_id": "label_123",
    "carrier_account": "carrier_123",
    "servicelevel_token": "usps_priority",
    "tracking_number": "9400111899221345678900",
    "tracking_status": "PRE_TRANSIT",
    "tracking_url_provider": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899221345678900",
    "rate": "8.45",
    "parcel": "parcel_123",
    "address_from": {
      "name": "John Doe",
      "street1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "address_to": {
      "name": "Jane Smith",
      "street1": "456 Oak Ave",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    },
    "metadata": "Order #123",
    "test": true,
    "created_at": "2023-10-01T12:00:00Z"
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
      files: context.files
    });
  },
  async test(context): Promise<any> {
    const result = await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files
    });

    if(!result || result.length === 0){
      return [newShippingLabel.sampleData]
    }

    return result
  },
});