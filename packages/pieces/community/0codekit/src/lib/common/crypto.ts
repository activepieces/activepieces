import { Property } from '@activepieces/pieces-framework';

export const zeroCodeKitCrypto = {
    cipher,
    secretKey,
    isHmac,
};

export const CIPHERS = ['AES', 'DES', 'TripleDES', 'Rabbit', 'RC4', 'RC4Drop'];

export const HASH_TYPES = [
    { label: 'MD5', value: 'MD5' },
    { label: 'SHA-1', value: 'SHA1' },
    { label: 'SHA-224', value: 'SHA224' },
    { label: 'SHA-256', value: 'SHA256' },
    { label: 'SHA-3', value: 'SHA3' },
    { label: 'SHA-384', value: 'SHA384' },
    { label: 'SHA-512', value: 'SHA512' },
    { label: 'RIPEMD-160', value: 'RIPEMD160' },
    { label: 'HMAC MD5', value: 'HmacMD5' },
    { label: 'HMAC SHA-1', value: 'HmacSHA1' },
    { label: 'HMAC SHA-224', value: 'HmacSHA224' },
    { label: 'HMAC SHA-256', value: 'HmacSHA256' },
    { label: 'HMAC SHA-3', value: 'HmacSHA3' },
    { label: 'HMAC SHA-384', value: 'HmacSHA384' },
    { label: 'HMAC SHA-512', value: 'HmacSHA512' },
    { label: 'HMAC RIPEMD-160', value: 'HmacRIPEMD160' },
];

function cipher() {
    return Property.StaticDropdown({
        displayName: 'Algorithm',
        description: 'The cipher to use. Decrypt with the same algorithm and secret key that encrypted the text.',
        required: true,
        defaultValue: 'AES',
        options: {
            options: CIPHERS.map((value) => ({ label: value, value })),
        },
    });
}

function secretKey({ description, required }: { description: string; required: boolean }) {
    return Property.ShortText({
        displayName: 'Secret Key',
        description,
        required,
    });
}

function isHmac(hashType: string): boolean {
    return hashType.startsWith('Hmac');
}
