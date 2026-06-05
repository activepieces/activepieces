import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

type TelegramFileInfo = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
};

type TelegramGetFileResponse = {
  ok: boolean;
  result: TelegramFileInfo;
};

export const telegramGetFileAction = createAction({
  auth: telegramBotAuth,
  name: 'get_file',
  description: 'Get file information and optionally download a file from Telegram',
  displayName: 'Get File',
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'File identifier to get information about',
      required: true,
    }),
    download: Property.Checkbox({
      displayName: 'Download File',
      description: 'If enabled, the file is downloaded and returned as base64.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(ctx) {
    const fileInfoResponse = await httpClient.sendRequest<TelegramGetFileResponse>({
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
    const fileUrl = fileInfo.file_path
      ? `https://api.telegram.org/file/bot${ctx.auth.secret_text}/${fileInfo.file_path}`
      : undefined;

    if (ctx.propsValue.download && fileUrl) {
      const fileResponse = await httpClient.sendRequest<Buffer>({
        method: HttpMethod.GET,
        url: fileUrl,
        responseType: 'arraybuffer',
      });

      const base64Content = Buffer.from(fileResponse.body).toString('base64');

      return {
        file_info: fileInfo,
        file_url: fileUrl,
        file_content_base64: base64Content,
      };
    }

    return {
      file_info: fileInfo,
      file_url: fileUrl,
    };
  },
});
