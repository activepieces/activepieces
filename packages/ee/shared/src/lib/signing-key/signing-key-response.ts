import { SigningKey } from './signing-key-model'

export type AddSigningKeyResponse = SigningKey & {
    privateKey: string
}
