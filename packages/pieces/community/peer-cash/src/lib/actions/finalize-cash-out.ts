import { createAction, Property } from '@activepieces/pieces-framework';
import { base } from 'viem/chains';
import { createPublicClient, http, isHash } from 'viem';
import { getCashClient, toSerializable } from '../common';

export const finalizeCashOut = createAction({
  name: 'finalize_cash_out',
  displayName: 'Finalize Confirmed Cash Out',
  description:
    'Resolve a confirmed create-deposit transaction into a resumable cash-out order.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a confirmed Base create-deposit receipt by transaction hash and resolves it into the Peer Cash deposit ID and resumable order state. Use after the createDeposit transaction from Prepare Cash Out confirms. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    transactionHash: Property.ShortText({
      displayName: 'Create Deposit Transaction Hash',
      required: true,
    }),
    rpcUrl: Property.ShortText({
      displayName: 'Base RPC URL',
      description: 'Optional Base RPC override.',
      required: false,
    }),
  },
  async run(context) {
    const transactionHash = context.propsValue.transactionHash;
    if (!isHash(transactionHash)) {
      throw new Error('Enter a valid transaction hash');
    }
    const publicClient = createPublicClient({
      chain: base,
      transport: http(context.propsValue.rpcUrl),
    });
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash,
    });
    const result = getCashClient().finalizePreparedCashout(receipt);
    return toSerializable(result);
  },
});
