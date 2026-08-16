import { Property } from '@activepieces/pieces-framework';

export const shortCode = Property.ShortText({
  displayName: 'Business Short Code',
  description: 'PayBill, Till, or organization short code assigned by Safaricom.',
  required: true,
});

export const amount = Property.Number({
  displayName: 'Amount (KES)',
  description: 'A positive whole amount in Kenyan shillings.',
  required: true,
});

export const initiatorName = Property.ShortText({
  displayName: 'Initiator Name',
  description: 'Daraja API operator/initiator username.',
  required: true,
});
