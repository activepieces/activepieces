import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramGetFileAction = createAction({
  auth: telegramBotAuth,
  name: 'get_file',
  description: 'Get file information and download a file from Telegram',
  displayName: 'Get File',
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'File identifier to get information about',
      required: true,
    }),
    download: Property.Checkbox({
      displayName: 'Download File',
      description: 'If enabled, the file will be downloaded and returned as base64',
      required: false,
      defaultValue: false,
    }),
  },
  async run(ctx) {
    const fileInfoResponse = await httpClient.sendRequest<{
      ok: boolean;
      result: {
        file_id: string;
        file_unique_id: string;
        file_size?: number;
        file_path?: string;
      };
    }>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'getFile'),
      body: {
        file_id: ctx.propsValue.file_id,
      },
    });

    if (!fileInfoResponse.body.ok) {
      throw new Error(`Failed to get file info: ${JSON.stringify(fileInfoResponse.body)}`);
    }

    const fileInfo = fileInfoResponse.body.result;

    if (ctx.propsValue.download && fileInfo.file_path) {
      const fileUrl = `https://api.telegram.org/file/bot${ctx.auth}/${fileInfo.file_path}`;
      
      const fileResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: fileUrl,
      });

      const base64Content = Buffer.from(fileResponse.body as any).toString('base64');

      return {
        file_info: fileInfo,
        file_url: fileUrl,
        file_content_base64: base64Content,
      };
    }

    return {
      file_info: fileInfo,
      file_url: fileInfo.file_path 
        ? `https://api.telegram.org/file/bot${ctx.auth}/${fileInfo.file_path}`
        : undefined,
    };
  },
});

