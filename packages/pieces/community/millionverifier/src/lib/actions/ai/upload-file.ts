import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { millionVerifierAuth } from '../../auth';
import { millionVerifierClient } from '../../common/client';
import type { MillionVerifierBulkFile } from '../../common/types';
import { millionverifierBulkFileOutputSchema } from '../../output-schemas';

export const uploadFileAction = createAction({
  auth: millionVerifierAuth,
  name: 'millionverifier_upload_file',
  outputSchema: millionverifierBulkFileOutputSchema,
  displayName: 'Upload Emails for Bulk Verification',
  description: 'Uploads a list of email addresses as a file and starts bulk verification.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Uploads a list of email addresses as one file and starts bulk verification, returning the file_id and its status. Spends one credit per unique email; check Get Credits first. Verification runs in the background: poll Get Bulk File until status is "finished", then use Download Bulk Report.',
    idempotent: false,
  },
  props: {
    emails: Property.Array({
      displayName: 'Emails',
      description: 'The email addresses to verify, one per item.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the uploaded file, shown in MillionVerifier and usable with List Bulk Files. Defaults to "emails.txt".',
      required: false,
    }),
  },
  async run(context) {
    const { emails, fileName } = context.propsValue;
    if (emails.length === 0) {
      throw new Error('Emails must contain at least one email address.');
    }
    const body = new FormData();
    body.append('file_contents', new Blob([emails.map(String).join('\n')], { type: 'text/plain' }), fileName ?? 'emails.txt');
    return await millionVerifierClient.bulkRequest<MillionVerifierBulkFile>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v2/upload',
      body,
    });
  },
});
