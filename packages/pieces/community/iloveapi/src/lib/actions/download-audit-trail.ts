import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';

export const downloadAuditTrailAction = createAction({
  auth: iloveapiAuth,
  name: 'download_audit_trail',
  displayName: 'Download Audit Trail',
  description:
    'Download the audit-trail PDF for a completed signature request. Useful for compliance and dispute resolution.',
  props: {
    token_requester: Property.ShortText({
      displayName: 'Requester Token',
      description: 'The "token_requester" of the completed signature request.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'Output File Name',
      description: 'Name to store the audit PDF under. Defaults to "audit-{token}.pdf".',
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
    const buffer = await iLoveApi.downloadAuditTrail({
      token,
      tokenRequester: token_requester,
    });

    const finalName = file_name ?? `audit-${token_requester}.pdf`;
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
