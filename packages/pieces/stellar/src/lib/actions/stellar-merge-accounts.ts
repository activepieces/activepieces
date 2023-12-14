import { createAction, Property } from "@activepieces/pieces-framework";
import { Operation } from "stellar-sdk"
import { validatePublicKeysBatch } from "../utils/validatePublicKeysBatch";

export const stellarMergeAccount = createAction({
    name: 'stellar-merge-account',
    displayName: 'Merge Stellar Accounts',
    description: 'Merge two Stellar accounts',
    props: {
        source: Property.ShortText({
            displayName: 'Source Public Key',
            required: true,
        }),
        destination: Property.ShortText({
            displayName: 'Destination Public Key',
            required: true,
        })
    },
    async run({store, propsValue}) {
        const { source, destination } = propsValue;
        
        if (validatePublicKeysBatch([source, destination])) {
		    const accountMergeOperation = Operation.accountMerge({ source, destination }).toXDR('base64');
            return { operation: accountMergeOperation};
        } else {
			throw new Error('Invalid public key');
		}
    }
});
