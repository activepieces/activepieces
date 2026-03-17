import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth, getPcloudApiUrl } from "../auth";

export const pcloudDownloadFile = createAction({
  auth: pcloudAuth,
  name: "download_pcloud_file",
  description: "Download a file from pCloud",
  displayName: "Download File",
  props: {
    path: Property.ShortText({
      displayName: "Path",
      description:
        "The path of the file to download (e.g. /Documents/report.pdf)",
      required: false,
    }),
    fileId: Property.Number({
      displayName: "File ID",
      description:
        "The ID of the file to download. If both path and file ID are provided, file ID takes precedence.",
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.fileId !== undefined && context.propsValue.fileId !== null) {
      queryParams["fileid"] = String(context.propsValue.fileId);
    } else if (context.propsValue.path) {
      queryParams["path"] = context.propsValue.path;
    } else {
      throw new Error("Either path or file ID must be provided.");
    }

    // First get the file link
    const linkResult = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${getPcloudApiUrl(context.auth)}/getfilelink`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const linkBody = linkResult.body as { result: number; error?: string; hosts: string[]; path: string };
    if (linkBody.result !== 0) {
      throw new Error(`pCloud error: ${linkBody.error ?? "result code " + linkBody.result}`);
    }
    const downloadUrl = `https://${linkBody.hosts[0]}${linkBody.path}`;

    // Download the actual file
    const fileResult = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
      responseType: "arraybuffer",
    });

    // Extract filename from path
    const filePath = context.propsValue.path || `file_${context.propsValue.fileId}`;
    const fileName = (filePath.match(/[^/]+$/) ?? ["downloaded_file"])[0];

    return {
      file: await context.files.write({
        fileName: fileName,
        data: Buffer.from(fileResult.body),
      }),
    };
  },
});
