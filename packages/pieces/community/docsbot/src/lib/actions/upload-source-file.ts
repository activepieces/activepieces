import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { docsbotCommon } from '../common/dropdown';

export const uploadSourceFile = createAction({
  auth: DocsBotAuth,
  name: 'uploadSourceFile',
  displayName: 'Upload Source File',
  description: 'Upload a file to create a new source for a bot.',
  props: {
    teamId: docsbotCommon.teamId,
    botId: docsbotCommon.botId,
    fileName: Property.ShortText({
      displayName: "File Name",
      description: "Name of the file (e.g., data.csv, document.pdf).",
      required: true,
    }),
    fileContent: Property.File({
      displayName: "File",
      description: "The file to upload.",
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: "Source Type",
      required: true,
      options: {
        options: [
          { label: "Document", value: "document" },
          { label: "CSV", value: "csv" },
          { label: "WordPress Export", value: "wp" },
          { label: "URLs File", value: "urls" },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: "Title",
      required: false,
    }),
    url: Property.ShortText({
      displayName: "Optional Source URL",
      description: "Include a related URL if needed.",
      required: false,
    }),
  },

  async run({ propsValue, auth }) {
    const { teamId, botId, fileName, fileContent, type, title, url } = propsValue;

    const presigned = await httpClient.sendRequest<{
      url: string;
      file: string;
    }>({
      method: HttpMethod.GET,
      url: `https://docsbot.ai/api/teams/${teamId}/bots/${botId}/upload-url?fileName=${encodeURIComponent(fileName)}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    const uploadUrl = presigned.body.url;
    const filePath = presigned.body.file;

    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: uploadUrl,
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: fileContent,
    });

    const createSourceResp = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://docsbot.ai/api/teams/${teamId}/bots/${botId}/sources`,
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
      },
      body: {
        type,
        title,
        file: filePath,
        ...(url ? { url } : {}),
      },
    });

    return createSourceResp.body;
  },
});