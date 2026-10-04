import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { getFileActionOutputSchema } from '../output-schemas';

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
  classification: 'READ',
  description: 'Get file details and, optionally, its content.',
  audience: 'human',
  aiMetadata: { description: 'Resolves a Telegram file_id to its file metadata, and optionally downloads the file (returned as a file reference and as base64) when download is enabled. Use to retrieve files attached to messages the bot received. Idempotent: read/download with no side effects.', idempotent: true },
  displayName: 'Get File',
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'The file_id of a photo, document or audio in a message.',
      placeholder: 'message.document.file_id from the trigger',
      required: true,
    }),
    download: Property.Checkbox({
      displayName: 'Download File',
      description:
        'Also return the file for later steps. Telegram caps this at 20 MB.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: getFileActionOutputSchema,
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

    if (ctx.propsValue.download && fileInfo.file_path) {
      const content = await downloadTelegramFile({
        botToken: ctx.auth.secret_text,
        filePath: fileInfo.file_path,
      });
      const file = await ctx.files.write({
        fileName: fileNameFromPath(fileInfo.file_path),
        data: content,
      });

      return {
        file_info: fileInfo,
        file,
        file_content_base64: content.toString('base64'),
      };
    }

    return {
      file_info: fileInfo,
    };
  },
});

async function downloadTelegramFile({
  botToken,
  filePath,
}: {
  botToken: string;
  filePath: string;
}): Promise<Buffer> {
  const response = await httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.GET,
    url: `https://api.telegram.org/file/bot${botToken}/${filePath}`,
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.body);
}

function fileNameFromPath(filePath: string): string {
  const segments = filePath.split('/');
  return segments[segments.length - 1] || filePath;
}
