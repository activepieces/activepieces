import { createAction, Property } from '@activepieces/pieces-framework';
import { blockchairRequest, SUPPORTED_BLOCKCHAINS } from '../common/blockchair-api';

export const getAddressDashboard = createAction({
  name: 'get_address_dashboard',
  displayName: 'Get Address Dashboard',
  description:
    'Get full address dashboard: balance, total received/sent, transaction count, and more.',
  props: {
    blockchain: Property.StaticDropdown({
      displayName: 'Blockchain',
      description: 'The blockchain the address belongs to',
      required: true,
      options: {
        options: SUPPORTED_BLOCKCHAINS,
      },
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'The blockchain address to look up',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const { blockchain, address } = context.propsValue;
    return await blockchairRequest(
      `/${blockchain}/dashboards/address/${address}`,
      apiKey
    );
  },
});
