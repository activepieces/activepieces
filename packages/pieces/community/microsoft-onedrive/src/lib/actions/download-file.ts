import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveCommon } from '../common/common';

export const downloadFile = createAction({
  auth: oneDriveAuth,
  name: 'download_file',
  description: 'Get and download a file using a File ID or filename.',
  displayName: 'Get File',
  props: {
    lookupBy: Property.StaticDropdown({
      displayName: 'Look Up By',
      required: true,
      defaultValue: 'id',
      options: {
        options: [
          { label: 'File ID', value: 'id' },
          { label: 'File Name', value: 'name' },
        ],
      },
    }),
    fileIdentifier: Property.ShortText({
      displayName: 'File ID / File Name',
      description:
        'Enter the File ID or the exact filename depending on the "Look Up By" selection',
      required: true,
    }),
  },
  async run(context) {
    const { lookupBy, fileIdentifier } = context.propsValue;
    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const baseUrl = oneDriveCommon.getBaseUrl(cloud);

    let fileId: string;

    if (lookupBy === 'name') {
      const escapedName = fileIdentifier.replace(/'/g, "''");
      const searchRes = await httpClient.sendRequest<{
        value: { id: string; name: string }[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/root/search(q='${encodeURIComponent(escapedName)}')`,
        queryParams: { $select: 'id,name', $top: '999' },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      const match = searchRes.body.value.find((f) => f.name === fileIdentifier);
      if (!match) {
        throw new Error(`No file found with name "${fileIdentifier}"`);
      }
      fileId = match.id;
    } else {
      fileId = fileIdentifier;
    }

    const fileDetails = await httpClient.sendRequest<{
      id: string;
      name: string;
      size: number;
      createdDateTime: string;
      lastModifiedDateTime: string;
      webUrl: string;
      file?: { mimeType: string };
      parentReference?: { path: string; driveId: string };
    }>({
      method: HttpMethod.GET,
      url: `${baseUrl}/items/${fileId}`,
      queryParams: {
        $select:
          'id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/items/${fileId}/content`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      responseType: 'arraybuffer',
    });

    const { id, name, size, createdDateTime, lastModifiedDateTime, webUrl, file, parentReference } =
      fileDetails.body;

    return {
      id,
      name,
      size,
      mimeType: file?.mimeType,
      createdDateTime,
      lastModifiedDateTime,
      webUrl,
      folderPath: parentReference?.path,
      driveId: parentReference?.driveId,
      data: await context.files.write({
        fileName: name,
        data: Buffer.from(result.body),
      }),
    };
  },
});
