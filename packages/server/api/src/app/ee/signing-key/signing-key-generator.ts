import {
    generateKeyPair as generateKeyPairCallback,
    RSAKeyPairOptions,
} from 'node:crypto'
import { promisify } from 'node:util'
import { KeyAlgorithm } from '@activepieces/ee-shared'

const generateKeyPair = promisify(generateKeyPairCallback)

export const signingKeyGenerator = {
    async generate(): Promise<GeneratedKeyPair> {
        const algorithm = 'rsa'

        const options: RSAKeyPairOptions<'pem', 'pem'> = {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
        }

        const keyPair = await generateKeyPair(algorithm, options)

        return {
            ...keyPair,
            algorithm: KeyAlgorithm.RSA,
        }
    },
}

type GeneratedKeyPair = {
    privateKey: string
    publicKey: string
    algorithm: KeyAlgorithm
}
