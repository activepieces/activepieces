import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { createFulfillmentOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiCreateFulfillment = createAction({
  auth: shopifyAuth,
  name: 'create_fulfillment',
  classification: 'WRITE',
  displayName: 'Create Fulfillment',
  description: 'Mark items of a fulfillment order as shipped, with optional tracking details.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fulfills (ships) items of one fulfillment order and returns the new fulfillment. Get the fulfillment order id and its line item ids from list_order_fulfillment_orders first. Leave line_items empty to fulfill everything still remaining on the fulfillment order, or list fulfillment order line items with quantities for a partial shipment. Tracking company, numbers and URLs are optional. notify_customer is sent explicitly and defaults to false; set it to true only when the customer should get the shipping confirmation email. Each call creates another fulfillment, so do not repeat it after a success. Needs the write_merchant_managed_fulfillment_orders access scope.',
    idempotent: false,
  },
  outputSchema: createFulfillmentOutputSchema,
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The fulfillment order to fulfill, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
    line_items: shopifyProps.fulfillmentOrderLineItems({
      description:
        'Optional partial shipment: the fulfillment order line items and quantities to ship. Leave empty to ship all remaining items of the fulfillment order.',
    }),
    tracking_company: Property.ShortText({
      displayName: 'Tracking Company',
      description:
        'The carrier name, for example "UPS", "USPS", "FedEx" or "DHL Express". With a supported carrier Shopify builds the tracking URL itself.',
      required: false,
    }),
    tracking_numbers: Property.Array({
      displayName: 'Tracking Numbers',
      description: 'One or more tracking numbers, for example "1Z999AA10123456784".',
      required: false,
    }),
    tracking_urls: Property.Array({
      displayName: 'Tracking URLs',
      description:
        'Tracking page URLs, one per tracking number, for example "https://www.ups.com/track?tracknum=1Z999AA10123456784". Only needed for carriers Shopify does not know.',
      required: false,
    }),
    notify_customer: Property.Checkbox({
      displayName: 'Notify Customer',
      description: 'Send the customer a shipping confirmation email. Off by default.',
      required: false,
      defaultValue: false,
    }),
    message: Property.ShortText({
      displayName: 'Message',
      description: 'Optional internal message recorded with the fulfillment.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fulfillmentOrderId = shopifyGraphqlClient.toGid({
      type: 'FulfillmentOrder',
      id: propsValue.fulfillment_order_id,
    });
    const trackingInfo = shopifyValues.compact({
      company: shopifyValues.nonEmpty(propsValue.tracking_company),
      numbers: shopifyValues.nonEmptyList(propsValue.tracking_numbers),
      urls: shopifyValues.nonEmptyList(propsValue.tracking_urls),
    });
    const fulfillment = shopifyValues.compact({
      lineItemsByFulfillmentOrder: [
        shopifyValues.compact({
          fulfillmentOrderId,
          fulfillmentOrderLineItems: shopifyValues.buildFulfillmentOrderLineItems(propsValue.line_items),
        }),
      ],
      trackingInfo: Object.keys(trackingInfo).length > 0 ? trackingInfo : undefined,
      notifyCustomer: propsValue.notify_customer ?? false,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentCreate: { fulfillment: GqlFulfillment | null } | null;
    }>({
      auth,
      query: `mutation CreateFulfillment($fulfillment: FulfillmentInput!, $message: String) { fulfillmentCreate(fulfillment: $fulfillment, message: $message) { fulfillment { ${shopifyFields.FULFILLMENT_FIELDS} } userErrors { field message } } }`,
      variables: {
        fulfillment,
        message: shopifyValues.nonEmpty(propsValue.message),
      },
    });
    const created = data.fulfillmentCreate?.fulfillment;
    if (!created) {
      throw new Error('Shopify did not return the new fulfillment.');
    }
    return {
      ...shopifyMappers.mapFulfillment(created),
      fulfillment_order_id: fulfillmentOrderId,
      redacted_fields: redactedFields,
    };
  },
});

