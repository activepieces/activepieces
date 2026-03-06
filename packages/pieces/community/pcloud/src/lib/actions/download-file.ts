import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pCloudAuth, getPCloudBaseUrl } from '../auth';
import { PCloudFileLinkResponse, buildDownloadUrl } from '../common';

export const downloadFile = createAction({
  auth: pCloudAuth,
  name: 'download_file',
  displayName: 'Download File Content',
  description:
    'Get the content of a file stored in pCloud. Returns the file as base64-encoded data.',
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file to download. You can find this in the output of Upload File or Find File/Folder actions.',
      required: false,
    }),
    file_path: Property.ShortText({
      displayName: 'File Path',
      description:
        'The full path to the file (e.g. /Documents/report.pdf). Use either File ID or File Path.',
      required: false,
    }),
    force_download: Property.Checkbox({
      displayName: 'Force Download',
      description:
        'Set to true to force the content-type to application/octet-stream, ensuring it downloads rather than previews.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const baseUrl = getPCloudBaseUrl(auth as unknown as { data?: Record<string, unknown> });
    const fileId = context.propsValue.file_id;
    const filePath = context.propsValue.file_path;
    const forceDownload = context.propsValue.force_download ?? false;

    if (!fileId && !filePath) {
      throw new Error('You must provide either a File ID or a File Path.');
    }

    // Step 1: Get the download link
    const linkParams: Record<string, string> = {};
    if (fileId) {
      linkParams['fileid'] = fileId;
    } else if (filePath) {
      linkParams['path'] = filePath;
    }

    if (forceDownload) {
      linkParams['forcedownload'] = '1';
    }

    const linkResponse = await httpClient.sendRequest<PCloudFileLinkResponse>({
      method: HttpMethod.GET,
      url: `${baseUrl}/getfilelink`,
      queryParams: linkParams,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    if (linkResponse.body.result !== 0) {
      throw new Error(
        `pCloud API error ${linkResponse.body.result}: Failed to get file download link.`
      );
    }

    const downloadUrl = buildDownloadUrl(linkResponse.body);

    // Step 2: Fetch the actual file content
    const fileResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
    });

    // Return the file content along with the download URL for convenience
    return {
      download_url: downloadUrl,
      expires: linkResponse.body.expires,
      content: fileResponse.body,
    };
  },
});
