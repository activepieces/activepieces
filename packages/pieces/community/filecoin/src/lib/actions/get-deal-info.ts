import { createAction, Property } from '@activepieces/pieces-framework';
import { httpGet } from '../common/filecoin-api';

export const getDealInfo = createAction({
  name: 'getDealInfo',
  displayName: 'Get Deal Info',
  description:
    'Get details about a specific Filecoin storage deal by its deal ID.',
  props: {
    dealId: Property.Number({
      displayName: 'Deal ID',
      description: 'The numeric Filecoin storage deal ID.',
      required: true,
    }),
  },
  async run(context) {
    const { dealId } = context.propsValue;

    if (dealId === undefined || dealId === null) {
      throw new Error('Deal ID is required.');
    }

    // Use Filfox API to get deal details
    const url = `https://filfox.info/api/v1/deal/${dealId}`;

    const response = (await httpGet(url)) as Record<string, unknown>;

    if (response && (response as { error?: string }).error) {
      throw new Error(
        `Failed to fetch deal info: ${(response as { error: string }).error}`
      );
    }

    return {
      dealId: dealId,
      client: response['client'] ?? null,
      provider: response['provider'] ?? null,
      label: response['label'] ?? null,
      pieceCid: response['pieceCid'] ?? null,
      pieceSize: response['pieceSize'] ?? null,
      pieceSizeFormatted: response['pieceSize']
        ? formatBytes(response['pieceSize'] as number)
        : null,
      verifiedDeal: response['verifiedDeal'] ?? null,
      startEpoch: response['startEpoch'] ?? null,
      endEpoch: response['endEpoch'] ?? null,
      storagePrice: response['storagePrice'] ?? null,
      providerCollateral: response['providerCollateral'] ?? null,
      clientCollateral: response['clientCollateral'] ?? null,
      sectorStartEpoch: response['sectorStartEpoch'] ?? null,
      height: response['height'] ?? null,
      stateKey: response['stateKey'] ?? null,
      dataSource: 'Filfox Explorer API',
    };
  },
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
