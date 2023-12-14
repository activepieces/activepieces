import { createAction, Property, StoreScope } from "@activepieces/pieces-framework";
import { Keypair } from "stellar-sdk"

export const stellarCreateAccount = createAction({
    name: 'stellar-create-account',
    displayName: 'Create Stellar Account',
    description: 'Create a Stellar Account',
    props: {
    },
    async run({store, propsValue}) {
        const keypair = Keypair.random();
        return {
            publicKey: keypair.publicKey(),
            privateKey: keypair.secret()
        }
    }
});
