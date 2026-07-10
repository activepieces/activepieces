import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';

export const downloadSignedFilesAction = createAction({
  auth: iloveapiAuth,
  name: 'download_signed_files',
  displayName: 'Download Signed Files',
  description:
    'Download the signed PDF (or ZIP if multiple files). The signature must be in "completed" status.',
  audience: 'both',
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
    file_name: Property.ShortText({
      displayName: 'Output File Name',
      description: 'Name to store the downloaded file under. Defaults to "signed-{token}.pdf".',
      required: false,
    }),
  },
  async run(context) {
    const { token_requester, file_name } = context.propsValue;
    if (!token_requester) {
      throw new Error('Requester Token is required.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    const buffer = await iLoveApi.downloadSignedFiles({
      token,
      tokenRequester: token_requester,
    });

    const finalName = file_name ?? `signed-${token_requester}.pdf`;
    const storedFile = await context.files.write({
      fileName: finalName,
      data: buffer,
    });

    return {
      output_file: storedFile,
      file_name: finalName,
      size: buffer.length,
    };
  },
});
