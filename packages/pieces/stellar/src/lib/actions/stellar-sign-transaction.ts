import { createAction, Property } from "@activepieces/pieces-framework";
import { Keypair, Operation, Server, TransactionBuilder } from "stellar-sdk"
import { validatePrivateKeysBatch, validatePublicKeysBatch } from "../utils/validatePublicKeysBatch";
import { setNetwork } from "../stellar-network/stellar-network";
import { StellarNetworks } from "../constants/stellar-network";

export const stellarSignTransaction = createAction({
    name: 'stellar-sign-transaction',
    displayName: 'Sign Stellar Transaction',
    description: 'Sign a Stellar transaction',
    props: {
        signingKeys: Property.Array({
            displayName: 'List of signing private keys',
            required: true,
            defaultValue: [],
        }),
        xdr: Property.ShortText({
            displayName: 'XDR to sign',
            required: true,
            defaultValue: "",
        }),
        submitTransaction: Property.Checkbox({
            displayName: 'Submit transaction',
            description: "Submit transaction before signing it",
            required: true,
            defaultValue: false,
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
    },
    async run({store, propsValue}) {
        const { xdr, signingKeys, network, submitTransaction } = propsValue;

        const stellarNetwork = setNetwork(network);
        const transaction = TransactionBuilder.fromXDR(xdr as string, stellarNetwork.passphrase);
	    let transactionResult: any;
        
        console.log("keys", signingKeys);

        if (true) {         
            for (const key of signingKeys) {
                const keypair = Keypair.fromSecret(key as string);
                transaction.sign(keypair);
            }
            
            if(submitTransaction){
                try{
                    const server = new Server(stellarNetwork.url);
                    transactionResult = await server.submitTransaction(transaction);
                } catch (error) {
                    throw new Error("Transaction Submission Failed");
                }
            }

        } else {
			throw new Error('Invalid public key');
		}

        return { result: transactionResult, transaction: transaction.toXDR() }
    }
});
