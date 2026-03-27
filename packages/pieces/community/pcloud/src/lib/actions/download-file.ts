import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { common, PcloudFileLink } from '../common';

export const pcloudDownloadFile = createAction({
  auth: pcloudAuth,
  name: 'pcloud_download_file',
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
    const linkResponse = await common.pcloudRequest<PcloudFileLink>(
      context.auth,
      'getfilelink',
      { fileid: context.propsValue.fileId },
    );

    const host = linkResponse.hosts[0];
    const downloadUrl = `https://${host}${linkResponse.path}`;
    const fileName = linkResponse.path.split('/').pop() ?? 'download';

    const fileResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
      responseType: 'arraybuffer',
    });

    return {
      file: await context.files.write({
        fileName,
        data: Buffer.from(fileResponse.body),
      }),
    };
  },
});
