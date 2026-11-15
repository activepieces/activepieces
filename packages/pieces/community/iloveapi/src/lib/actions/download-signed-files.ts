import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import { iloveSchemas } from '../common/schemas';

export const downloadSignedFilesAction = createAction({
  auth: iloveapiAuth,
  name: 'download_signed_files',
  classification: 'READ',
  displayName: 'Download Signed Files',
  description:
    'Download the signed PDF (or ZIP if multiple files). The signature must be in "completed" status.',
  audience: 'both',
  outputSchema: iloveSchemas.signatureDownload,
  aiMetadata: {
    description:
      'Retrieve the finished signed document for a signature request by its requester token, returning a single PDF or a ZIP when several files were signed. The request must already be in "completed" status (check first with Get Signature Status); for the evidence log use Download Audit Trail. Read-only retrieval, safe to repeat.',
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
      description: 'Name to store the downloaded file under. Defaults to "signed-{token}.pdf" (".zip" when several files were signed).',
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
      kind: 'signed',
    });

    const extension = contentType?.includes('zip') ? 'zip' : 'pdf';
    const finalName = context.propsValue.file_name?.trim() || `signed-${tokenRequester}.${extension}`;
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
