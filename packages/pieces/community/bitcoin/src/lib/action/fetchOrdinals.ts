import { Property, createAction } from '@activepieces/pieces-framework';
import { createApi } from '../api';

export const FetchOrdinals = createAction({
    requireAuth: false,
    name: 'fetch_ordinals',
    displayName: 'Fetch Ordinals',
    description: 'Collect available ordinals for the given address',
    props: {
        network: Property.StaticDropdown<'mainnet' | 'testnet'>({
            displayName: 'Network',
            description: 'Network to fetch ordinals for',
            required: true,
            options: {
                options: [
                    { label: 'Mainnet', value: 'mainnet' },
                    { label: 'Testnet', value: 'testnet' },
                ],
            },
        }),
        address: Property.ShortText({
            displayName: 'Address',
            description: 'Address to fetch ordinals for',
            required: true,
        }),
    },
    async run({ propsValue: { address, network } }) {
        const api = createApi({
            utxoSource: 'blockstream',
        });

        return api
            .getUnspentOutputs({ address, network, blockchain: 'bitcoin' })
            .catch((e) => {
                throw JSON.parse(JSON.stringify(e));
            })
            .then((outputs) =>
                Promise.all(
                    outputs.map(async ({ txid: transactionHash, index }) =>
                        api.getOutputOrdinals({
                            transactionHash,
                            index,
                            network,
                            blockchain: 'bitcoin',
                        })
                    )
                )
            )
            .catch((e) => {
                throw JSON.parse(JSON.stringify(e));
            })
            .then((ordinals) => ordinals.flat());
    },
});
