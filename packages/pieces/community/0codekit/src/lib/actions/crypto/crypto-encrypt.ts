import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitCrypto } from '../../common/crypto';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const cryptoEncryptAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'crypto_encrypt',
    classification: 'READ',
    displayName: 'Crypto Encrypt',
    description: 'Encrypt text with a secret key using AES, DES, Triple DES, Rabbit or RC4.',
    audience: 'both',
    aiMetadata: {
        description:
            'Encrypt plaintext with a symmetric cipher (AES by default) and a secret key, returning the ciphertext as text. Pair with Crypto Decrypt using the same algorithm and key; for one-way fingerprints use Crypto Hash instead. Pure transform with no side effects, safe to retry.',
        idempotent: true,
    },
    props: {
        cryptoType: zeroCodeKitCrypto.cipher(),
        message: Property.LongText({
            displayName: 'Text',
            description: 'The plain text to encrypt.',
            required: true,
        }),
        secretKey: zeroCodeKitCrypto.secretKey({
            description: 'The key (passphrase) used to encrypt. Keep it safe: you need the same key to decrypt.',
            required: true,
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.cryptoEncrypt,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<EncryptResponse>({
            apiKey: auth.secret_text,
            path: '/crypto/encrypt',
            body: {
                cryptoType: propsValue.cryptoType,
                message: propsValue.message,
                secretKey: propsValue.secretKey,
            },
        });
        return {
            encrypted_text: response.encryptedText,
        };
    },
});

type EncryptResponse = {
    encryptedText: string;
};
