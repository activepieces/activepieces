import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetLinkedAccountFilesOutputSchema } from '../../../output-schemas';

export const getLinkedAccountFilesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_linked_account_files',
  outputSchema: podioGetLinkedAccountFilesOutputSchema,
  displayName: 'Get Linked Account Files',
  description: 'Lists the files and folders in a linked storage account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the files and folders in an external storage account (such as Dropbox or Google Drive) linked to Podio. Needs a linked account; its id comes from Get Linked Accounts. Pass an external file id to Upload Linked Account File to bring the file into Podio.',
    idempotent: true,
  },
  props: {
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked account, from Get Linked Accounts.' }),
    externalFolderId: podioAiProps.text({ required: false, displayName: 'External Folder ID', description: 'Only files under this folder, using the external_file_id of a folder from an earlier call.' }),
    filetype: podioAiProps.choice({ required: false, displayName: 'File Type', description: 'Only files of this type.', values: ['image', 'application', 'video', 'text', 'audio'] }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'Only files and folders matching this name.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of files to return. Defaults to 100.' }),
    sortBy: podioAiProps.choice({ required: false, displayName: 'Sort By', description: 'The attribute to sort by.', values: ['name', 'mimetype', 'created_on', 'updated_on'] }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending, "false" ascending. Defaults to "false".' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/file/linked_account/${propsValue.linkedAccountId}/`,
      query: podioUtils.query({
        values: {
          external_folder_id: propsValue.externalFolderId,
          filetype: propsValue.filetype,
          name: propsValue.name,
          limit: propsValue.limit ?? 100,
          sort_by: propsValue.sortBy,
          sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
        },
      }),
    });
    return { files: body, count: body.length };
  },
});
