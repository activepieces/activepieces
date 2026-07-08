import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { voucheryIoAuth } from '../common/auth';
import { comapaignIdDropdown } from '../common/props';
import { tr } from 'zod/v4/locales';

export const createAVoucher = createAction({
  auth: voucheryIoAuth,
  name: 'createAVoucher',
  displayName: 'Create a voucher',
  description: 'Create a new voucher in a campaign',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new voucher with the given code inside a specific Vouchery campaign, optionally setting an expiration date, activation date, gift card value, and assigned customer. Use to issue a redeemable voucher or gift card under a campaign. Not idempotent: each call creates a voucher, so repeating it generates additional vouchers (a duplicate code may error).',
    idempotent: false,
  },
  props: {
    campaignId: comapaignIdDropdown,
    voucherCode: Property.ShortText({
      displayName: 'Voucher Code',
      description: 'The code for the voucher',
      required: true,
    }),

    voucher_valid_until: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'The date and time when the voucher expires',
      required: false,
    }),
    customer_identifier: Property.Number({
      displayName: 'Customer Identifier',
      description: 'The identifier for the customer',
      required: false,
    }),
    gift_card_value: Property.Number({
      displayName: 'Gift Card Value',
      description: 'The value of the gift card',
      required: false,
    }),
    activates_at: Property.DateTime({
      displayName: 'Activation Date',
      description: 'The date and time when the voucher becomes active',
      required: false,
    }),
  },
  async run(context) {
    const {
      campaignId,
      voucherCode,
      voucher_valid_until,
      customer_identifier,
      gift_card_value,
      activates_at,
    } = context.propsValue;

    const body: any = {
      code: voucherCode,
    };

    if (voucher_valid_until)
      body.valid_until = new Date(voucher_valid_until).toISOString();
    if (customer_identifier) body.customer_identifier = customer_identifier;
    if (gift_card_value) body.gift_card_value = gift_card_value;
    if (activates_at) body.activates_at = new Date(activates_at).toISOString();

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/campaigns/${campaignId}/vouchers`,
      body
    );

    return response;
  },
});
