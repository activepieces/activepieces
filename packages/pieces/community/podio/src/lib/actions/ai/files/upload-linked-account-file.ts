import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioUploadLinkedAccountFileOutputSchema } from '../../../output-schemas';

export const uploadLinkedAccountFileAction = createAction({
  auth: podioAuth,
  name: 'podio_upload_linked_account_file',
  outputSchema: podioUploadLinkedAccountFileOutputSchema,
  displayName: 'Upload Linked Account File',
  description: 'Brings a file from a linked storage account into Podio.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Podio file from a file in an external storage account (such as Dropbox or Google Drive) linked to Podio and returns its file id, ready for Attach File or Replace File. Needs a linked account; its id comes from Get Linked Accounts and the external file id from Get Linked Account Files. Each call creates another file.',
    idempotent: false,
  },
  props: {
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked account, from Get Linked Accounts.' }),
    externalFileId: podioAiProps.text({ required: true, displayName: 'External File ID', description: 'The external_file_id of the file, from Get Linked Account Files.' }),
    preservePermissions: podioAiProps.bool({ required: false, displayName: 'Preserve Permissions', description: '"true" keeps the current sharing permissions of the file in the external account.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/file/linked_account/${propsValue.linkedAccountId}/`,
      body: podioUtils.body({
        values: {
          external_file_id: propsValue.externalFileId,
          preserve_permissions: podioUtils.toBool({ value: propsValue.preservePermissions }),
        },
      }),
    });
  },
});
