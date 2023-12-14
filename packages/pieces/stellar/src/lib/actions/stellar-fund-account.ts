import { createAction, Property, StoreScope } from "@activepieces/pieces-framework";
import axios from "axios";
import { StrKey } from "stellar-sdk"
import { STELLAR_FRIENDBOT_URL, StellarNetworks } from "../constants/stellar-network";
import { validatePublicKeysBatch } from "../utils/validatePublicKeysBatch";

export const stellarFundAccount = createAction({
    name: 'stellar-fund-account',
    displayName: 'Fund Stellar Account',
    description: 'Fund a Stellar Account',
    props: {
        publicKey: Property.ShortText({
            displayName: 'Public Key',
            required: true,
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
        })
    },
    async run({store, propsValue}) {
        const publicKey = propsValue.publicKey
        const FUND_ACCOUNT_URL = `${STELLAR_FRIENDBOT_URL[StellarNetworks.TESTNET]}${publicKey}`

        if (validatePublicKeysBatch([publicKey])) {
			await axios.get(FUND_ACCOUNT_URL)
		} else {
			throw new Error('Invalid public key');
		}

		return { accountFunded: publicKey };
    }
});
