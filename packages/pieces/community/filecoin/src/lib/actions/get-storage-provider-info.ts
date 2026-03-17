import { createAction, Property } from '@activepieces/pieces-framework';
import { httpGet } from '../common/filecoin-api';

export const getStorageProviderInfo = createAction({
  name: 'getStorageProviderInfo',
  displayName: 'Get Storage Provider Info',
  description:
    'Get detailed information about a Filecoin storage provider (miner) by their miner ID.',
  props: {
    minerId: Property.ShortText({
      displayName: 'Miner ID',
      description:
        'The Filecoin miner/storage provider ID (e.g., f01234 or t01234).',
      required: true,
    }),
  },
  async run(context) {
    const { minerId } = context.propsValue;

    if (!minerId) {
      throw new Error('Miner ID is required.');
    }

    const cleanMinerId = minerId.trim();

    // Use Filfox API to get miner details
    const url = `https://filfox.info/api/v1/address/${cleanMinerId}`;

    const response = (await httpGet(url)) as Record<string, unknown>;

    if (response && (response as { error?: string }).error) {
      throw new Error(
        `Failed to fetch miner info: ${(response as { error: string }).error}`
      );
    }

    return {
      minerId: cleanMinerId,
      address: response['address'] ?? null,
      robust: response['robust'] ?? null,
      balance: response['balance'] ?? null,
      balanceFIL: response['balance']
        ? (
            Number(BigInt(response['balance'] as string) / BigInt(10 ** 15)) /
            1000
          ).toFixed(4) + ' FIL'
        : null,
      actor: response['actor'] ?? null,
      createHeight: response['createHeight'] ?? null,
      lastSeenHeight: response['lastSeenHeight'] ?? null,
      ownedMiners: response['ownedMiners'] ?? [],
      workerMiners: response['workerMiners'] ?? [],
      messageCount: response['messageCount'] ?? null,
      dataSource: 'Filfox Explorer API',
    };
  },
});
