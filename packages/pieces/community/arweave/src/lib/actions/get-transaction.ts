import { createAction, Property } from '@activepieces/pieces-framework';

export const getTransaction = createAction({
  name: 'getTransaction',
  displayName: 'Get Transaction',
  description: 'Fetch details about a specific Arweave transaction by its ID.',
  auth: undefined,
  props: {
    transaction_id: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The Arweave transaction ID (43-character base64url string).',
      required: true,
    }),
  },
  async run(context) {
    const { transaction_id } = context.propsValue;
    const txId = transaction_id.trim();

    const response = await fetch(`https://arweave.net/tx/${txId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Transaction not found: ${txId}`);
      }
      if (response.status === 202) {
        throw new Error(`Transaction is pending confirmation: ${txId}`);
      }
      throw new Error(`Arweave API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      format: number;
      id: string;
      last_tx: string;
      owner: string;
      tags: Array<{ name: string; value: string }>;
      target: string;
      quantity: string;
      data_size: string;
      data_root: string;
      reward: string;
    };

    const quantityAr = data.quantity ? Number(BigInt(data.quantity)) / 1e12 : 0;
    const rewardAr = data.reward ? Number(BigInt(data.reward)) / 1e12 : 0;

    return {
      id: data.id,
      format: data.format,
      last_tx: data.last_tx,
      owner: data.owner,
      target: data.target,
      quantity_winston: data.quantity,
      quantity_ar: quantityAr,
      data_size: data.data_size,
      data_root: data.data_root,
      reward_winston: data.reward,
      reward_ar: rewardAr,
      tags: data.tags,
    };
  },
});
