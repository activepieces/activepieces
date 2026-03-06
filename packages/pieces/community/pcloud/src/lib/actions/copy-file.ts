import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pCloudAuth, getPCloudBaseUrl } from '../auth';
import { PCloudCopyFileResponse, pCloudFolderIdProp } from '../common';

export const copyFile = createAction({
  auth: pCloudAuth,
  name: 'copy_file',
  displayName: 'Copy File',
  description: 'Copy a file to another folder in pCloud.',
  props: {
    source_file_id: Property.ShortText({
      displayName: 'Source File ID',
      description: 'The ID of the file to copy.',
      required: false,
    }),
    source_file_path: Property.ShortText({
      displayName: 'Source File Path',
      description:
        'The full path to the source file (e.g. /Documents/original.pdf). Use either Source File ID or Source File Path.',
      required: false,
    }),
    destination_folder_id: pCloudFolderIdProp,
    destination_file_name: Property.ShortText({
      displayName: 'Destination File Name',
      description:
        'Name for the copied file. If left blank, the original filename is preserved.',
      required: false,
    }),
    no_overwrite: Property.Checkbox({
      displayName: 'Do Not Overwrite',
      description:
        'If a file with the same name already exists at the destination, the operation will fail instead of overwriting.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const baseUrl = getPCloudBaseUrl(auth as unknown as { data?: Record<string, unknown> });
    const sourceFileId = context.propsValue.source_file_id;
    const sourceFilePath = context.propsValue.source_file_path;
    const destinationFolderId = context.propsValue.destination_folder_id ?? '0';
    const destinationFileName = context.propsValue.destination_file_name;
    const noOverwrite = context.propsValue.no_overwrite ?? false;

    if (!sourceFileId && !sourceFilePath) {
      throw new Error('You must provide either a Source File ID or a Source File Path.');
    }

    const queryParams: Record<string, string> = {
      tofolderid: String(destinationFolderId),
    };

    if (sourceFileId) {
      queryParams['fileid'] = sourceFileId;
    } else if (sourceFilePath) {
      queryParams['path'] = sourceFilePath;
    }

    if (destinationFileName) {
      queryParams['toname'] = destinationFileName;
    }

    if (noOverwrite) {
      queryParams['noover'] = '1';
    }

    const response = await httpClient.sendRequest<PCloudCopyFileResponse>({
      method: HttpMethod.GET,
      url: `${baseUrl}/copyfile`,
      queryParams,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(
        `pCloud API error ${response.body.result}: Failed to copy file.`
      );
    }

    return response.body.metadata;
  },
});
