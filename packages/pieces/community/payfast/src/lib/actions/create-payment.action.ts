import { createAction, Property } from '@activepieces/pieces-framework';
import { payfastAuth } from '../auth';
import {
  payfastBaseUrl,
  payfastSignature,
} from '../common/signature';

export const createPaymentAction = createAction({
  auth: payfastAuth,
  name: 'create_payment',
  displayName: 'Create Payment Link',
  description:
    'Build a PayFast payment URL. Redirect a customer to it, or embed it in a button or email.',
  props: {
    amount: Property.Number({
      displayName: 'Amount (ZAR)',
      description: 'Amount in rands, e.g. 250.00',
      required: true,
    }),
    item_name: Property.ShortText({
      displayName: 'Item Name',
      description: 'Shown on the PayFast checkout page.',
      required: true,
    }),
    item_description: Property.LongText({
      displayName: 'Item Description',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your unique order or invoice reference (m_payment_id).',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Customer Email',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'Customer First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Customer Last Name',
      required: false,
    }),
    return_url: Property.ShortText({
      displayName: 'Success Return URL',
      description: 'Where to send the customer after a successful payment.',
      required: false,
    }),
    cancel_url: Property.ShortText({
      displayName: 'Cancel URL',
      required: false,
    }),
    notify_url: Property.ShortText({
      displayName: 'Notify (Webhook) URL',
      description:
        'Optional. Leave blank to use the trigger webhook instead.',
      required: false,
    }),
    email_confirmation: Property.Checkbox({
      displayName: 'Email Confirmation',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const fields: Record<string, string | number | undefined> = {
      merchant_id: auth.props.merchant_id,
      merchant_key: auth.props.merchant_key,
      return_url: propsValue.return_url,
      cancel_url: propsValue.cancel_url,
      notify_url: propsValue.notify_url,
      name_first: propsValue.first_name,
      name_last: propsValue.last_name,
      email_address: propsValue.email,
      m_payment_id: propsValue.reference,
      amount: Number(propsValue.amount).toFixed(2),
      item_name: propsValue.item_name,
      item_description: propsValue.item_description,
      email_confirmation: propsValue.email_confirmation ? '1' : undefined,
      confirmation_address: propsValue.email_confirmation
        ? propsValue.email
        : undefined,
    };

    const signature = payfastSignature(fields, auth.props.passphrase);
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined || v === null) continue;
      query.append(k, String(v));
    }
    query.append('signature', signature);

    const url = `${payfastBaseUrl(!!auth.props.sandbox)}?${query.toString()}`;
    return { payment_url: url };
  },
});
