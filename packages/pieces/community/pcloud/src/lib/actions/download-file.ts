import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../..';
import { pcloudCommon, PcloudFileLinkResponse } from '../common';

export const pcloudDownloadFile = createAction({
  auth: pcloudAuth,
  name: 'download_file',
  displayName: 'Download File Content',
  description:
    'Fetch attachments for email automation workflows or backup scripts that require local copies of cloud-stored data.',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to download',
      required: true,
    }),
  },
  async run(context) {
    const linkResponse =
      await pcloudCommon.sendPcloudRequest<PcloudFileLinkResponse>(
        context.auth,
        HttpMethod.GET,
        '/getfilelink',
        {
          fileid: context.propsValue.fileId,
        },
      );

    const downloadUrl = `https://${linkResponse.hosts[0]}${linkResponse.path}`;

    const fileResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
      responseType: 'arraybuffer',
    });

    const fileName = linkResponse.path.split('/').pop() ?? 'download';

    return {
      file: await context.files.write({
        fileName,
        data: Buffer.from(fileResponse.body),
      }),
    };
  },
});
