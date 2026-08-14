import { createAction, Property } from '@activepieces/pieces-framework';
import { getCashClient, toSerializable } from '../common';

export const prepareAccessPolicy = createAction({
  name: 'prepare_access_policy',
  displayName: 'Prepare Access Policy',
  description:
    'Prepare the unsigned access-policy transaction required by restricted payout methods.',
  audience: 'both',
  aiMetadata: {
    description:
      'Prepares an unsigned access-policy transaction for a confirmed Peer Cash deposit when Prepare Cash Out returned accessPolicyRequired. The host must inspect, sign, submit, and confirm it before the order can fill. Read-only on-chain and idempotent.',
    idempotent: true,
  },
  props: {
    depositId: Property.ShortText({
      displayName: 'Deposit ID',
      description:
        'Composite Peer Cash deposit ID returned after finalization.',
      required: true,
    }),
  },
  async run(context) {
    return toSerializable(
      getCashClient().prepareAccessPolicy(context.propsValue.depositId)
    );
  },
});
