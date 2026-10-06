import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitCrypto } from '../../common/crypto';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const cryptoDecryptAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'crypto_decrypt',
    classification: 'READ',
    displayName: 'Crypto Decrypt',
    description: 'Decrypt text that was encrypted with a secret key using AES, DES, Triple DES, Rabbit or RC4.',
    audience: 'both',
    aiMetadata: {
        description:
            'Decrypt ciphertext produced by Crypto Encrypt (or any CryptoJS-compatible passphrase cipher) back to plain text. The algorithm and secret key must match the ones used to encrypt; a wrong key yields empty or garbled text. Pure transform with no side effects, safe to retry.',
        idempotent: true,
    },
    props: {
        cryptoType: zeroCodeKitCrypto.cipher(),
        ciphertext: Property.LongText({
            displayName: 'Encrypted Text',
            description: 'The encrypted text to decrypt, such as the Crypto Encrypt output.',
            required: true,
        }),
        secretKey: zeroCodeKitCrypto.secretKey({
            description: 'The key (passphrase) that was used to encrypt the text.',
            required: true,
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.cryptoDecrypt,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<DecryptResponse>({
            apiKey: auth.secret_text,
            path: '/crypto/decrypt',
            body: {
                cryptoType: propsValue.cryptoType,
                ciphertext: propsValue.ciphertext,
                secretKey: propsValue.secretKey,
            },
        });
        return {
            decrypted_text: response.decryptedText,
        };
    },
});

type DecryptResponse = {
    decryptedText: string;
};
