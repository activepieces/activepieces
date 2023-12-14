import { createAction, Property } from "@activepieces/pieces-framework";
import { BASE_FEE, Operation, Server, TransactionBuilder, xdr } from "stellar-sdk"
import { validatePublicKeysBatch } from "../utils/validatePublicKeysBatch";
import { setNetwork } from "../stellar-network/stellar-network";
import { StellarNetworks } from "../constants/stellar-network";

export const stellarBuildTransaction = createAction({
    name: 'stellar-build-transaction',
    displayName: 'Build Stellar Transaction',
    description: 'Build Stellar transaction with the given operations',
    props: {
        source: Property.ShortText({
            displayName: "Source Public Key",
            required: true
        }),
        network: Property.StaticDropdown({
            displayName: "Network",
            required: true,
            options: {
                options: [{
                    label: "Testnet",
                    value: StellarNetworks.TESTNET
                }]
            }
        }),
        operations: Property.Array({
            displayName: 'List of Operations',
            required: true,
            defaultValue: [],
        }),
        timeout: Property.Number({
            displayName: "Transaction Timeout",
            required: true,
            defaultValue: 300,
        }),
        fee: Property.ShortText({
            displayName: "Fee",
            required: true,
            defaultValue: BASE_FEE
        }),
        memo: Property.Checkbox({
            displayName: "Memo",
            required: false,
            defaultValue: false
        }),
        memoProps: Property.DynamicProperties({
            displayName: "Memo ID",
            required: true,
            refreshers: ['memo'],
            props: async (propsValue) => {
                const properties = {
                    memoId: Property.ShortText({
                        displayName: "MemoId",
                        required: true,
                        defaultValue: "Ejemplo Memo ID",
                    })
                }

                return properties
            }
        })
    },
    async run({store, propsValue}) {
        const { operations, fee, memo, memoProps, network, source, timeout } = propsValue;
        const { memoId } = memoProps

        if(validatePublicKeysBatch([source])){
            const stellarNetwork = setNetwork(network);
            const server = new Server(stellarNetwork.url);

            const sourceAccount = await server.loadAccount(source);
            const transaction = new TransactionBuilder(sourceAccount, {
                fee,
                networkPassphrase: stellarNetwork.passphrase,
            }).setTimeout(timeout | 30);

            for (const operationXdr of operations) {
                if (operationXdr) {
                    const operation = xdr.Operation.fromXDR(operationXdr as string, 'base64');
                    transaction.addOperation(operation);
                }
            }

            const transactionXdr = transaction.build().toXDR();

            return { transaction: transactionXdr };
        }

        throw new Error("Invalid Public Key")
    }
});
