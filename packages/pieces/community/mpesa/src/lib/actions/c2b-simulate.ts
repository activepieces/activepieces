import { createAction, Property } from '@activepieces/pieces-framework';
import { mpesaAuth, mpesaAuthValue } from '../auth';
import { amount, shortCode } from '../common/props';
import { mpesaPost, normalizeKenyanPhone, positiveInteger } from '../common/client';

export const c2bSimulate = createAction({
  auth: mpesaAuth,
  name: 'c2b_simulate',
  displayName: 'C2B: Simulate Payment',
  description: 'Simulate a customer-to-business payment in the Daraja sandbox.',
  audience: 'both',
  aiMetadata: {
    description: 'Simulates one PayBill or Buy Goods C2B payment in the Safaricom sandbox. Use only for testing; every call creates a new simulated transaction.',
    idempotent: false,
  },
  props: {
    shortCode,
    commandId: Property.StaticDropdown({ displayName: 'Payment Type', required: true, defaultValue: 'CustomerPayBillOnline', options: { options: [
      { label: 'PayBill', value: 'CustomerPayBillOnline' }, { label: 'Buy Goods', value: 'CustomerBuyGoodsOnline' },
    ] } }),
    amount,
    msisdn: Property.ShortText({ displayName: 'Customer Phone Number', required: true }),
    billReferenceNumber: Property.ShortText({ displayName: 'Bill Reference Number', required: false }),
  },
  async run(context) {
    const auth = mpesaAuthValue(context.auth);
    if (auth.environment !== 'sandbox') throw new Error('C2B simulation is only available in the Sandbox environment.');
    const p = context.propsValue;
    return mpesaPost(auth, '/mpesa/c2b/v1/simulate', {
      ShortCode: p.shortCode, CommandID: p.commandId, Amount: positiveInteger(p.amount),
      Msisdn: normalizeKenyanPhone(p.msisdn), BillRefNumber: p.billReferenceNumber ?? '',
    });
  },
});
