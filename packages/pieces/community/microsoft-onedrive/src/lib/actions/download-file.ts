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
      const searchRes = await httpClient.sendRequest<{
        value: { id: string; name: string }[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/root/search(q='${encodeURIComponent(fileIdentifier)}')`,
        queryParams: { $select: 'id,name', $top: '10' },
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

    const fileDetails = await httpClient.sendRequest<{ name: string }>({
      method: HttpMethod.GET,
      url: `${baseUrl}/items/${fileId}?$select=name`,
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

    const desiredHeaders = [
      'content-length',
      'content-type',
      'content-location',
      'expires',
    ];
    const filteredHeaders: Record<string, unknown> = {};

    if (result.headers) {
      for (const key of desiredHeaders) {
        filteredHeaders[key] = result.headers[key];
      }
    }

    return {
      ...filteredHeaders,
      data: await context.files.write({
        fileName: fileDetails.body.name,
        data: Buffer.from(result.body),
      }),
    };
  },
});
