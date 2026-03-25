import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { tapfiliateAuth } from '../..';
import { tapfiliateApiCall } from '../common/tapfiliate.client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const createConversionAction = createAction({
  auth: tapfiliateAuth,
  name: 'create_conversion',
  displayName: 'Create Conversion',
  description: 'Creates a conversion in Tapfiliate.',
  props: {
    referralCode: Property.ShortText({
      displayName: 'Referral Code',
      required: false,
    }),
    trackingId: Property.ShortText({
      displayName: 'Tracking ID',
      required: false,
    }),
    clickId: Property.ShortText({
      displayName: 'Click ID',
      required: false,
    }),
    coupon: Property.ShortText({
      displayName: 'Coupon',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter ISO currency code such as USD or EUR.',
      required: false,
    }),
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      required: false,
    }),
    sourceId: Property.ShortText({
      displayName: 'Source ID',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Unique ID such as an order number.',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: false,
    }),
    commissionType: Property.ShortText({
      displayName: 'Commission Type',
      required: false,
    }),
    programGroup: Property.ShortText({
      displayName: 'Program Group',
      required: false,
    }),
    userAgent: Property.LongText({
      displayName: 'User Agent',
      required: false,
    }),
    ip: Property.ShortText({
      displayName: 'IP Address',
      required: false,
    }),
    metaData: Property.Json({
      displayName: 'Meta Data',
      required: false,
    }),
  },
  async run(context) {
    const metaData = isRecord(context.propsValue.metaData)
      ? context.propsValue.metaData
      : undefined;

    return await tapfiliateApiCall({
      method: HttpMethod.POST,
      path: '/conversions/',
      apiKey: context.auth.props.apiKey,
      body: {
        ...(context.propsValue.referralCode
          ? { referral_code: context.propsValue.referralCode }
          : {}),
        ...(context.propsValue.trackingId
          ? { tracking_id: context.propsValue.trackingId }
          : {}),
        ...(context.propsValue.clickId
          ? { click_id: context.propsValue.clickId }
          : {}),
        ...(context.propsValue.coupon
          ? { coupon: context.propsValue.coupon }
          : {}),
        ...(context.propsValue.currency
          ? { currency: context.propsValue.currency }
          : {}),
        ...(context.propsValue.assetId
          ? { asset_id: context.propsValue.assetId }
          : {}),
        ...(context.propsValue.sourceId
          ? { source_id: context.propsValue.sourceId }
          : {}),
        ...(context.propsValue.externalId
          ? { external_id: context.propsValue.externalId }
          : {}),
        ...(context.propsValue.amount !== undefined &&
        context.propsValue.amount !== null
          ? { amount: context.propsValue.amount }
          : {}),
        ...(context.propsValue.customerId
          ? { customer_id: context.propsValue.customerId }
          : {}),
        ...(context.propsValue.commissionType
          ? { commission_type: context.propsValue.commissionType }
          : {}),
        ...(context.propsValue.programGroup
          ? { program_group: context.propsValue.programGroup }
          : {}),
        ...(context.propsValue.userAgent
          ? { user_agent: context.propsValue.userAgent }
          : {}),
        ...(context.propsValue.ip ? { ip: context.propsValue.ip } : {}),
        ...(metaData ? { meta_data: metaData } : {}),
      },
    });
  },
});
