import { StrKey } from "stellar-sdk"

const validatePublicKeysBatch = (keys: string[]) => {
    return keys.every(StrKey.isValidEd25519PublicKey)
}

const validatePrivateKeysBatch = (keys: string[]) => {
    return keys.every(StrKey.isValidEd25519SecretSeed)
}

export { validatePublicKeysBatch, validatePrivateKeysBatch }