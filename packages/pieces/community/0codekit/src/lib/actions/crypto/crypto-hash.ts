import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { HASH_TYPES, zeroCodeKitCrypto } from '../../common/crypto';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const cryptoHashAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'crypto_hash',
    classification: 'READ',
    displayName: 'Crypto Hash',
    description: 'Create a hash (MD5, SHA, RIPEMD) or an HMAC signature of a text.',
    audience: 'both',
    aiMetadata: {
        description:
            'Compute a one-way hash (MD5, SHA-1/2/3, RIPEMD-160) of a text, or an HMAC signature when an HMAC algorithm and secret key are given, for example to verify webhook signatures. Use Crypto Encrypt instead when the text must be recoverable. Pure transform, safe to retry.',
        idempotent: true,
    },
    props: {
        hashType: Property.StaticDropdown({
            displayName: 'Algorithm',
            description: 'The hash algorithm. HMAC algorithms also need a secret key.',
            required: true,
            defaultValue: 'SHA256',
            options: {
                options: HASH_TYPES,
            },
        }),
        message: Property.LongText({
            displayName: 'Text',
            description: 'The text to hash.',
            required: true,
        }),
        secretKey: zeroCodeKitCrypto.secretKey({
            description: 'The key used to sign the text. Required for HMAC algorithms, ignored otherwise.',
            required: false,
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.cryptoHash,
    async run({ auth, propsValue }) {
        const hmac = zeroCodeKitCrypto.isHmac(propsValue.hashType);
        const secretKey = propsValue.secretKey ?? '';
        if (hmac && secretKey === '') {
            throw new Error(`${propsValue.hashType} needs a Secret Key. Enter one, or pick a non-HMAC algorithm.`);
        }
        const response = await zeroCodeKitApi.post<HashResponse>({
            apiKey: auth.secret_text,
            path: '/crypto/hash',
            body: {
                hashType: propsValue.hashType,
                message: propsValue.message,
                secretKey: hmac ? secretKey : undefined,
            },
        });
        return {
            hashed_text: response.hashedText,
            algorithm: propsValue.hashType,
        };
    },
});

type HashResponse = {
    hashedText: string;
};
