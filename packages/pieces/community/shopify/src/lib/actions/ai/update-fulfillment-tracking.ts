import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateFulfillmentTracking = createAction({
  auth: shopifyAuth,
  name: 'update_fulfillment_tracking',
  classification: 'WRITE',
  displayName: 'Update Fulfillment Tracking',
  description: 'Change the carrier, tracking numbers or tracking URLs of a fulfillment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates the tracking information of one existing fulfillment and returns it. Only the fields you supply are sent. Tracking numbers and tracking URLs are lists that REPLACE the stored lists when sent: to add a number, send the complete list including the numbers already on the fulfillment (read them with get_fulfillment_details first). At least one of tracking_company, tracking_numbers or tracking_urls is required. notify_customer is sent explicitly and defaults to false; with true the customer gets a shipping update email, and every call made with notify_customer=true sends another email, so set it to true only on the one call that should notify (never on retries). Repeating the same call leaves the same tracking in place. Needs the write_merchant_managed_fulfillment_orders access scope.',
    idempotent: true,
  },
  props: {
    fulfillment_id: Property.ShortText({
      displayName: 'Fulfillment ID',
      description:
        'The fulfillment id, numeric or "gid://shopify/Fulfillment/…". Find it with list_order_fulfillments.',
      required: true,
    }),
    tracking_company: Property.ShortText({
      displayName: 'Tracking Company',
      description: 'The carrier name, for example "UPS", "USPS", "FedEx" or "DHL Express".',
      required: false,
    }),
    tracking_numbers: Property.Array({
      displayName: 'Tracking Numbers',
      description:
        'The complete list of tracking numbers. Replaces the stored list; leave empty to keep it.',
      required: false,
    }),
    tracking_urls: Property.Array({
      displayName: 'Tracking URLs',
      description:
        'The complete list of tracking page URLs, one per tracking number. Replaces the stored list; leave empty to keep it.',
      required: false,
    }),
    notify_customer: Property.Checkbox({
      displayName: 'Notify Customer',
      description: 'Send the customer a shipping update email. Off by default.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fulfillmentId = shopifyGraphqlClient.toGid({ type: 'Fulfillment', id: propsValue.fulfillment_id });
    const trackingInfoInput = shopifyValues.compact({
      company: shopifyValues.nonEmpty(propsValue.tracking_company),
      numbers: shopifyValues.nonEmptyList(propsValue.tracking_numbers),
      urls: shopifyValues.nonEmptyList(propsValue.tracking_urls),
    });
    if (Object.keys(trackingInfoInput).length === 0) {
      throw new Error(
        'Nothing to update: provide tracking_company, tracking_numbers or tracking_urls. Nothing was changed.'
      );
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentTrackingInfoUpdate: { fulfillment: GqlFulfillment | null } | null;
    }>({
      auth,
      query: `mutation UpdateFulfillmentTracking($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean) { fulfillmentTrackingInfoUpdate(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput, notifyCustomer: $notifyCustomer) { fulfillment { ${shopifyFields.FULFILLMENT_SUMMARY_FIELDS} } userErrors { field message } } }`,
      variables: {
        fulfillmentId,
        trackingInfoInput,
        notifyCustomer: propsValue.notify_customer ?? false,
      },
    });
    const fulfillment = data.fulfillmentTrackingInfoUpdate?.fulfillment;
    if (!fulfillment) {
      throw new Error('Shopify did not return the updated fulfillment.');
    }
    return {
      ...shopifyMappers.mapFulfillmentSummary(fulfillment),
      redacted_fields: redactedFields,
    };
  },
});
