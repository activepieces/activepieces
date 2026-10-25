import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { UploadInput, iLoveApi } from '../common/client';
import { regionOf, regionProp } from '../common/props';
import { iloveSchemas } from '../common/schemas';
import { signatureBodyOf } from '../common/signature';

export const createSignatureRequestAiAction = createAction({
  auth: iloveapiAuth,
  name: 'create_signature_request_ai',
  classification: 'WRITE',
  displayName: 'Send PDF for Signature',
  description: 'Send PDFs (by public URL) to signers by name and email. Signers place their own fields.',
  audience: 'ai',
  outputSchema: iloveSchemas.signature,
  aiMetadata: {
    description:
      'Create an iLoveSign signature request from 1 to 5 public https PDF URLs and up to 50 signers (name, email, role signer/validator/viewer). Signers place their own signature fields. Each call creates a new request, emails every signer and spends signature credits, so never call it twice for the same document. Returns the requester token for status, reminder, void and download actions.',
    idempotent: false,
  },
  props: {
    file_urls: Property.Array({
      displayName: 'PDF URLs',
      description: 'Public https URLs of the PDFs to sign (1 to 5).',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      required: true,
      properties: {
        name: Property.ShortText({ displayName: 'Name', required: true }),
        email: Property.ShortText({ displayName: 'Email', required: true }),
        type: Property.ShortText({
          displayName: 'Role',
          description: 'signer (default), validator or viewer.',
          required: false,
        }),
      },
    }),
    subject_signer: Property.ShortText({
      displayName: 'Email Subject',
      required: false,
    }),
    message_signer: Property.LongText({
      displayName: 'Email Message',
      required: false,
    }),
    expiration_days: Property.Number({
      displayName: 'Expiration (days)',
      description: '1 to 130. Default 120.',
      required: false,
    }),
    region: regionProp,
  },
  async run(context) {
    const { file_urls, signers, subject_signer, message_signer, expiration_days } = context.propsValue;
    const uploads = urlUploads(file_urls);
    const draft = signatureBodyOf({
      signers,
      elements: [],
      options: { subject_signer, message_signer, expiration_days },
    });
    return iLoveApi.createSignatureRequest({
      publicKey: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      uploads,
      draft,
    });
  },
});

function urlUploads(value: unknown): UploadInput[] {
  const list = Array.isArray(value) ? value : [];
  const urls = list.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((item) => item !== '');
  if (urls.length === 0) {
    throw new Error('At least one PDF URL is required.');
  }
  return urls.map((url, index) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`PDF URL ${index + 1} is not a valid URL.`);
    }
    if (parsed.protocol !== 'https:') {
      throw new Error(`PDF URL ${index + 1} must use https.`);
    }
    return { kind: 'url', url: parsed.toString() };
  });
}
