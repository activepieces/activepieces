import { StellarNetworks } from "../constants/stellar-network";

class StellarNetwork {
	url: string;
	passphrase: string;

	constructor(networkUrl: string, networkPassphrase: string) {
		this.url = networkUrl;
		this.passphrase = networkPassphrase;
	}
}

const STELLAR_TESTNET_NETWORK = 'https://horizon-testnet.stellar.org/';
const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const STELLAR_PUBNET_NETWORK = 'https://horizon.stellar.org/';
const STELLAR_PUBNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

export function setNetwork(network: StellarNetworks
): StellarNetwork {
	let stellarNetwork!: StellarNetwork;

	switch (network) {
		case StellarNetworks.TESTNET:
			stellarNetwork = new StellarNetwork(STELLAR_TESTNET_NETWORK, STELLAR_TESTNET_PASSPHRASE);
			break;
		case StellarNetworks.PUBLIC:
			stellarNetwork = new StellarNetwork(STELLAR_PUBNET_NETWORK, STELLAR_PUBNET_PASSPHRASE);
			break;
	}

    return stellarNetwork
}
