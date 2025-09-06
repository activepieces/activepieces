import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { docsbotCommon } from '../common/dropdown';
import { makeRequest } from '../common/client';

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

    const presigned = await makeRequest(
      auth,
      HttpMethod.GET,
      `/api/teams/${teamId}/bots/${botId}/upload-url`,
      { fileName: encodeURIComponent(fileName) }
    );

    const uploadUrl = presigned.url;
    const filePath = presigned.file;

    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: uploadUrl,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileContent.data,
    });

    const source = await makeRequest(
      auth,
      HttpMethod.POST,
      `/api/teams/${teamId}/bots/${botId}/sources`,
      undefined,
      {
        type,
        file: filePath,
        ...(title ? { title } : {}),
        ...(url ? { url } : {}),
      }
    );

    return {
      success: true,
      uploadedFile: {
        name: fileName,
        path: filePath,
      },
      source,
    };
  },
});