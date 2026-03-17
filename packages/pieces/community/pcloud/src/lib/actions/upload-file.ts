import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth } from "../auth";

export const pcloudUploadFile = createAction({
  auth: pcloudAuth,
  name: "upload_pcloud_file",
  description: "Upload a file to pCloud",
  displayName: "Upload File",
  props: {
    path: Property.ShortText({
      displayName: "Folder Path",
      description:
        "The path of the destination folder (e.g. /Documents). Use / for the root folder.",
      required: false,
    }),
    folderId: Property.Number({
      displayName: "Folder ID",
      description:
        "The ID of the destination folder. Use 0 for root. If both path and folder ID are provided, folder ID takes precedence.",
      required: false,
    }),
    filename: Property.ShortText({
      displayName: "File Name",
      description: "The name for the uploaded file (e.g. report.pdf)",
      required: true,
    }),
    file: Property.File({
      displayName: "File",
      description: "The file URL or base64 to upload",
      required: true,
    }),
    overwrite: Property.Checkbox({
      displayName: "Overwrite",
      description:
        "If set to true, overwrites the file if it already exists in the folder.",
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const fileBuffer = Buffer.from(fileData.base64, "base64");

    const queryParams: Record<string, string> = {};

    if (context.propsValue.folderId !== undefined && context.propsValue.folderId !== null) {
      queryParams["folderid"] = String(context.propsValue.folderId);
    } else if (context.propsValue.path) {
      queryParams["path"] = context.propsValue.path;
    } else {
      queryParams["folderid"] = "0";
    }

    queryParams["filename"] = context.propsValue.filename;

    if (context.propsValue.overwrite) {
      queryParams["renameifexists"] = "0";
    } else {
      queryParams["renameifexists"] = "1";
    }

    const boundary = "----ActivepiecesBoundary" + Date.now();
    const header =
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${context.propsValue.filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(header),
      fileBuffer,
      Buffer.from(footer),
    ]);

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: "https://api.pcloud.com/uploadfile",
      queryParams,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
