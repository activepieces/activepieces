enum StellarNetworks {
    PUBLIC, TESTNET, CUSTOM 
}

const STELLAR_FRIENDBOT_URL = {
    [StellarNetworks.TESTNET]: "https://friendbot.stellar.org/?addr="
}

const STELLAR_NETWORK_PASSPHRASE = {
    [StellarNetworks.TESTNET]: "Test SDF Network ; September 2015"
}

export { STELLAR_NETWORK_PASSPHRASE, STELLAR_FRIENDBOT_URL, StellarNetworks }