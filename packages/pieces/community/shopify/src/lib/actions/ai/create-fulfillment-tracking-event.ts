import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentEvent,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateFulfillmentTrackingEvent = createAction({
  auth: shopifyAuth,
  name: 'create_fulfillment_tracking_event',
  classification: 'WRITE',
  displayName: 'Create Fulfillment Tracking Event',
  description: 'Add a shipment status event (in transit, out for delivery, delivered, …) to a fulfillment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one tracking event to a fulfillment, such as IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED or FAILURE, with an optional message, time, estimated delivery and place. The event updates the shipment status the customer sees. Each call adds another event, so do not repeat it after a success; list_fulfillment_events shows what is already recorded. Needs the write_fulfillments access scope.',
    idempotent: false,
  },
  props: {
    fulfillment_id: Property.ShortText({
      displayName: 'Fulfillment ID',
      description:
        'The fulfillment id, numeric or "gid://shopify/Fulfillment/…". Find it with list_order_fulfillments.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The shipment status this event reports.',
      required: true,
      options: {
        options: [
          { label: 'Label purchased', value: 'LABEL_PURCHASED' },
          { label: 'Label printed', value: 'LABEL_PRINTED' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Carrier picked up', value: 'CARRIER_PICKED_UP' },
          { label: 'In transit', value: 'IN_TRANSIT' },
          { label: 'Out for delivery', value: 'OUT_FOR_DELIVERY' },
          { label: 'Ready for pickup', value: 'READY_FOR_PICKUP' },
          { label: 'Attempted delivery', value: 'ATTEMPTED_DELIVERY' },
          { label: 'Delayed', value: 'DELAYED' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Failure', value: 'FAILURE' },
        ],
      },
    }),
    message: Property.ShortText({
      displayName: 'Message',
      description: 'Optional message, for example "Arrived at sorting facility".',
      required: false,
    }),
    happened_at: Property.DateTime({
      displayName: 'Happened At',
      description: 'When the event happened, ISO 8601. Defaults to now on Shopify\'s side.',
      required: false,
    }),
    estimated_delivery_at: Property.DateTime({
      displayName: 'Estimated Delivery At',
      description: 'The new estimated delivery time, ISO 8601.',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City where the event happened, for example "Memphis".',
      required: false,
    }),
    province: Property.ShortText({
      displayName: 'Province',
      description: 'Province or state where the event happened, for example "Tennessee".',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country where the event happened, for example "United States".',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP',
      description: 'Postal code where the event happened.',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address',
      description: 'Street address where the event happened.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fulfillmentId = shopifyGraphqlClient.toGid({ type: 'Fulfillment', id: propsValue.fulfillment_id });
    const fulfillmentEvent = shopifyValues.compact({
      fulfillmentId,
      status: propsValue.status,
      message: shopifyValues.nonEmpty(propsValue.message),
      happenedAt: shopifyValues.nonEmpty(propsValue.happened_at),
      estimatedDeliveryAt: shopifyValues.nonEmpty(propsValue.estimated_delivery_at),
      city: shopifyValues.nonEmpty(propsValue.city),
      province: shopifyValues.nonEmpty(propsValue.province),
      country: shopifyValues.nonEmpty(propsValue.country),
      zip: shopifyValues.nonEmpty(propsValue.zip),
      address1: shopifyValues.nonEmpty(propsValue.address1),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentEventCreate: { fulfillmentEvent: GqlFulfillmentEvent | null } | null;
    }>({
      auth,
      query: `mutation CreateFulfillmentEvent($fulfillmentEvent: FulfillmentEventInput!) { fulfillmentEventCreate(fulfillmentEvent: $fulfillmentEvent) { fulfillmentEvent { ${shopifyFields.FULFILLMENT_EVENT_FIELDS} } userErrors { field message } } }`,
      variables: { fulfillmentEvent },
    });
    const event = data.fulfillmentEventCreate?.fulfillmentEvent;
    if (!event) {
      throw new Error('Shopify did not return the new fulfillment event.');
    }
    return {
      ...shopifyMappers.mapFulfillmentEvent(event),
      fulfillment_id: fulfillmentId,
      redacted_fields: redactedFields,
    };
  },
});
