import { OutputSchema } from '@activepieces/pieces-framework';

export const openpgpEncryptActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'filename', label: 'File Name' },
    { key: 'file', label: 'Encrypted File', format: 'url' },
    { key: 'error', label: 'Error' },
  ],
};

export const base64EncodeActionOutputSchema = wholeStringOutput({
  key: 'encodedText',
  label: 'Base64 Text',
  description: 'The input text encoded as a base64 string.',
});

export const base64DecodeActionOutputSchema = wholeStringOutput({
  key: 'decodedText',
  label: 'Decoded Text',
  description: 'The plain text decoded from the base64 input.',
});

export const generatePasswordActionOutputSchema = wholeStringOutput({
  key: 'password',
  label: 'Password',
  description:
    'The randomly generated password, at the requested length and character set.',
});

export const hashTextActionOutputSchema = wholeStringOutput({
  key: 'hash',
  label: 'Hash',
  description: 'The hex-encoded digest of the input text.',
});

export const hmacSignatureActionOutputSchema = wholeStringOutput({
  key: 'signature',
  label: 'HMAC Signature',
  description:
    'The HMAC digest of the input text, encoded as hex or base64 per the Output Encoding setting.',
});

export const rsaSignatureActionOutputSchema = wholeStringOutput({
  key: 'signature',
  label: 'RSA Signature',
  description:
    'The RSA signature of the input text, encoded as base64 or hex per the Output Encoding setting.',
});

function wholeStringOutput({
  key,
  label,
  description,
}: {
  key: string;
  label: string;
  description: string;
}): OutputSchema {
  return { fields: [{ key, label, value: '', description }] };
}
