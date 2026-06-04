import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest, cleanObject } from '../common/client';

export const cancelSubscription = createAction({
  name: 'cancel_subscription',
  auth: chargebeeAuth,
  displayName: 'Cancel Subscription',
  description:
    'Cancel a Chargebee subscription immediately, at end of term, or on a specific date.',
  props: {
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      required: true,
    }),
    cancel_option: Property.StaticDropdown({
      displayName: 'Cancel Option',
      description:
        'When to cancel the subscription. Not applicable when the subscription has a contract term — use Contract Term Cancel Option instead.',
      required: false,
      options: {
        options: [
          { label: 'Immediately', value: 'immediately' },
          { label: 'End of Term', value: 'end_of_term' },
          { label: 'Specific Date', value: 'specific_date' },
          { label: 'End of Billing Term', value: 'end_of_billing_term' },
        ],
      },
    }),
    cancel_at: Property.Number({
      displayName: 'Cancel At (Unix Seconds)',
      description:
        'UTC timestamp in seconds for when to cancel. Required when Cancel Option is "Specific Date".',
      required: false,
    }),
    cancel_reason_code: Property.ShortText({
      displayName: 'Cancel Reason Code',
      description:
        'Reason code from Settings > Configure Chargebee > Reason Codes > Subscriptions > Subscription Cancellation. Case-sensitive.',
      required: false,
    }),
    credit_option_for_current_term_charges: Property.StaticDropdown({
      displayName: 'Credit Option for Current Term Charges',
      description:
        'How to handle credits for current term charges when canceling immediately.',
      required: false,
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Prorate', value: 'prorate' },
          { label: 'Full', value: 'full' },
        ],
      },
    }),
    unbilled_charges_option: Property.StaticDropdown({
      displayName: 'Unbilled Charges Option',
      description:
        'How to handle unbilled charges when canceling immediately.',
      required: false,
      options: {
        options: [
          { label: 'Invoice', value: 'invoice' },
          { label: 'Delete', value: 'delete' },
        ],
      },
    }),
    contract_term_cancel_option: Property.StaticDropdown({
      displayName: 'Contract Term Cancel Option',
      description:
        'Required when the subscription has a contract term. Determines when to cancel the subscription and contract term.',
      required: false,
      options: {
        options: [
          { label: 'Terminate Immediately', value: 'terminate_immediately' },
          { label: 'End of Contract Term', value: 'end_of_contract_term' },
          { label: 'Specific Date', value: 'specific_date' },
          {
            label: 'End of Subscription Billing Term',
            value: 'end_of_subscription_billing_term',
          },
        ],
      },
    }),
    account_receivables_handling: Property.StaticDropdown({
      displayName: 'Account Receivables Handling',
      description:
        'How to handle past due invoices when canceling immediately.',
      required: false,
      options: {
        options: [
          { label: 'No Action', value: 'no_action' },
          {
            label: 'Schedule Payment Collection',
            value: 'schedule_payment_collection',
          },
          { label: 'Write Off', value: 'write_off' },
        ],
      },
    }),
    refundable_credits_handling: Property.StaticDropdown({
      displayName: 'Refundable Credits Handling',
      description:
        'How to handle refundable credits when canceling immediately.',
      required: false,
      options: {
        options: [
          { label: 'No Action', value: 'no_action' },
          { label: 'Schedule Refund', value: 'schedule_refund' },
        ],
      },
    }),
    invoice_date: Property.Number({
      displayName: 'Invoice Date (Unix Seconds)',
      description:
        'Document date displayed on the invoice PDF. Defaults to the current date. Provide to backdate the invoice.',
      required: false,
    }),
    decommissioned: Property.Checkbox({
      displayName: 'Decommission',
      description:
        'When true, all subscription operations will be disabled except deletion. This is irreversible.',
      required: false,
    }),
    termination_fee_item_price_id: Property.ShortText({
      displayName: 'Termination Fee Item Price ID',
      description:
        'The unique ID of the charge item price representing the termination fee. Used only when the subscription has a contract term.',
      required: false,
    }),
    termination_fee_quantity: Property.Number({
      displayName: 'Termination Fee Quantity',
      description:
        'Quantity for the termination fee. Applicable only for quantity-based item prices.',
      required: false,
    }),
    termination_fee_unit_price: Property.Number({
      displayName: 'Termination Fee Unit Price (cents)',
      description:
        'The termination fee in cents. For quantity-based items, this is the fee per unit.',
      required: false,
    }),
    termination_fee_service_period_days: Property.Number({
      displayName: 'Termination Fee Service Period (Days)',
      description:
        'Service period of the termination fee in days, starting from the current date.',
      required: false,
    }),
  },
  async run(context) {
    const {
      subscription_id,
      cancel_option,
      cancel_at,
      cancel_reason_code,
      credit_option_for_current_term_charges,
      unbilled_charges_option,
      contract_term_cancel_option,
      account_receivables_handling,
      refundable_credits_handling,
      invoice_date,
      decommissioned,
      termination_fee_item_price_id,
      termination_fee_quantity,
      termination_fee_unit_price,
      termination_fee_service_period_days,
    } = context.propsValue;

    const body = cleanObject({
      cancel_option,
      cancel_at,
      cancel_reason_code,
      credit_option_for_current_term_charges,
      unbilled_charges_option,
      contract_term_cancel_option,
      account_receivables_handling,
      refundable_credits_handling,
      invoice_date,
      decommissioned,
      'subscription_items[item_price_id][0]': termination_fee_item_price_id,
      'subscription_items[quantity][0]': termination_fee_quantity,
      'subscription_items[unit_price][0]': termination_fee_unit_price,
      'subscription_items[service_period_days][0]':
        termination_fee_service_period_days,
    });

    return await chargebeeRequest({
      site: context.auth.props.site,
      apiKey: context.auth.props.api_key,
      method: HttpMethod.POST,
      path: `/subscriptions/${encodeURIComponent(subscription_id)}/cancel_for_items`,
      contentType: 'application/x-www-form-urlencoded',
      body,
    });
  },
});
