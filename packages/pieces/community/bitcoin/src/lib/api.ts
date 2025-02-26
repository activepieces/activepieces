// import { assertNotNullOrUndefined } from '@swanblocks-inc/shared';
import assert from 'assert';
import axios from 'axios';
import { JSDOM } from 'jsdom';

type NetworkParams = {
    blockchain:
    | 'bitcoin'
    | 'bitcoin-cash'
    | 'litecoin'
    | 'dash'
    | 'dogecoin'
    | 'zcash';
    network: 'testnet' | 'mainnet';
};

type UnspentOutputsParams = NetworkParams & {
    address: string;
};

type ApiList<T> = {
    limit: number;
    offset: number;
    total: number;
    items: T[];
};

type ApiResponse<T> = {
    apiVersion: string;
    requestId: string;
    context: string;
    data: T;
};

type UtxoCryptoapis = {
    address: string;
    amount: string;
    index: number;
    isAvailable: boolean;
    isConfirmed: boolean;
    timestamp: number;
    transactionId: string;
};

type UtxoBlockstream = {
    txid: string;
    vout: number;
    status: {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
    };
    value: number;
};

type Utxo = {
    txid: string;
    index: number;
    confirmed: boolean;
    value: number;
};

type CreateApiParams = {
    utxoSource: 'blockstream' | 'cryptoapis';
};

export const createApi = ({
    utxoSource = 'blockstream',
}: Partial<CreateApiParams>) => {
    const cryptoapis = axios.create({
        baseURL: 'https://rest.cryptoapis.io',
        headers: {
            'X-API-Key': '7f0e974c70441512f565e47abc06a268d0e01efc', // TODO: move to env
            'Content-Type': 'application/json',
        },
    });

    const blockstream = axios.create({
        baseURL: 'https://blockstream.info',
    });

    type OutputOrdinalsParams = NetworkParams & {
        transactionHash: string;
        index: number;
    };

    const getOutputsCryptoapis = async ({
        address,
        blockchain = 'bitcoin',
        network = 'testnet',
    }: Partial<UnspentOutputsParams>): Promise<Utxo[]> => {
        const limit = 50;
        const result: UtxoBlockstream[] = [];

        const request = async (offset: number) =>
            cryptoapis.get<ApiResponse<ApiList<UtxoCryptoapis>>>(
                `/blockchain-data/${blockchain}/${network}/addresses/${address}/unspent-outputs`,
                {
                    params: {
                        limit,
                        offset,
                    },
                }
            );

        const responses = [await request(0)];
        const first = responses[0];
        if (first.data.data.total > limit) {
            responses.push(
                ...(await Promise.all(
                    new Array(
                        Math.ceil((first.data.data.total - limit) / limit)
                    )
                        .fill(0)
                        .map((_, i) => request(limit * (i + 1)))
                ))
            );
        }

        return responses
            .map((r) =>
                r.data.data.items.map((utxo) => ({
                    txid: utxo.transactionId,
                    index: utxo.index,
                    confirmed: utxo.isConfirmed,
                    value: Number(utxo.amount) * 1e8,
                }))
            )
            .flat();
    };

    const getOutputsBlockstream = async ({
        address,
        blockchain = 'bitcoin',
        network = 'testnet',
    }: Partial<UnspentOutputsParams>) => {
        assert(blockchain === 'bitcoin', 'blockchain should be bitcoin');
        const networkPrefix = network === 'testnet' ? '/testnet' : '';

        return blockstream
            .get<Array<UtxoBlockstream>>(
                `${networkPrefix}/api/address/${address}/utxo`
            )
            .then((r) =>
                r.data.map((utxo) => ({
                    txid: utxo.txid,
                    index: utxo.vout,
                    confirmed: utxo.status.confirmed,
                    value: utxo.value,
                }))
            );
    };

    return {
        getOutputOrdinals: async ({
            blockchain = 'bitcoin',
            network = 'testnet',
            transactionHash,
            index,
        }: Partial<OutputOrdinalsParams>) => {
            // assertNotNullOrUndefined(transactionHash, 'transactionHash');
            // assertNotNullOrUndefined(index, 'index');
            // TODO: blockchain and network to URL
            const ordinals: Partial<
                Record<
                    OutputOrdinalsParams['blockchain'],
                    Partial<Record<OutputOrdinalsParams['network'], string>>
                >
            > = {
                bitcoin: {
                    mainnet: `https://ordinals.com`,
                    testnet: `https://ordinals-testnet.gamma.io`,
                },
            };
            const url = ordinals[blockchain]?.[network];
            // assertNotNullOrUndefined(url, 'url');

            const dom = await axios
                .get(url + `/output/${transactionHash}:${index}`)
                .then((r) => new JSDOM(r.data));

            return Array.from(
                dom.window.document.querySelectorAll('main>ul>li')
            ).map((el) => {
                const [start, end] = el.textContent?.split('–') as [
                    string,
                    string
                ];
                return {
                    start,
                    end,
                };
            });
        },
        getUnspentOutputs: ({
            address,
            blockchain = 'bitcoin',
            network = 'testnet',
        }: Partial<UnspentOutputsParams>) => {
            // assertNotNullOrUndefined(address, 'address');
            const sourceFn =
                utxoSource === 'cryptoapis'
                    ? getOutputsCryptoapis
                    : getOutputsBlockstream;

            return sourceFn({
                address,
                blockchain,
                network,
            });
        },
    };
};
