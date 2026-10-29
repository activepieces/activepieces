import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import { iloveSchemas } from '../common/schemas';

export const downloadAuditTrailAction = createAction({
  auth: iloveapiAuth,
  name: 'download_audit_trail',
  classification: 'READ',
  displayName: 'Download Audit Trail',
  description:
    'Download the audit-trail PDF for a completed signature request. Useful for compliance and dispute resolution.',
  audience: 'both',
  outputSchema: iloveSchemas.signatureDownload,
  aiMetadata: {
    description:
      'Fetch the audit-trail PDF (the legal evidence/event log) for a completed signature request, identified by its requester token, for compliance and dispute resolution. Read-only retrieval, safe to repeat; to get the actual signed documents use Download Signed Files instead.',
    idempotent: true,
  },
  props: {
    token_requester: Property.ShortText({
      displayName: 'Requester Token',
      description: 'The "token_requester" of the completed signature request.',
      required: true,
    }),
    server: Property.ShortText({
      displayName: 'Server',
      description:
        'Optional. The "server" value returned by Create Signature Request. When empty, the server is looked up from the signature request.',
      required: false,
    }),
    file_name: Property.ShortText({
      displayName: 'Output File Name',
      description: 'Name to store the audit PDF under. Defaults to "audit-{token}.pdf".',
      required: false,
    }),
  },
  async run(context) {
    const tokenRequester = (context.propsValue.token_requester ?? '').trim();
    if (!tokenRequester) {
      throw new Error('Requester Token is required.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    const { data, contentType } = await iLoveApi.downloadSignatureFile({
      token,
      tokenRequester,
      server: context.propsValue.server ?? undefined,
      kind: 'audit',
    });

    const extension = contentType?.includes('zip') ? 'zip' : 'pdf';
    const finalName = context.propsValue.file_name?.trim() || `audit-${tokenRequester}.${extension}`;
    const storedFile = await context.files.write({
      fileName: finalName,
      data,
    });

    return {
      output_file: storedFile,
      file_name: finalName,
      size: data.length,
      content_type: contentType,
      token_requester: tokenRequester,
    };
  },
});
