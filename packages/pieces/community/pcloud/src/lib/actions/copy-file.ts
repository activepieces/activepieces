import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth, getPcloudApiUrl } from "../auth";

export const pcloudCopyFile = createAction({
  auth: pcloudAuth,
  name: "copy_pcloud_file",
  description: "Copy a file to another location in pCloud",
  displayName: "Copy File",
  props: {
    filePath: Property.ShortText({
      displayName: "Source File Path",
      description: "The path of the file to copy (e.g. /Documents/report.pdf)",
      required: false,
    }),
    fileId: Property.Number({
      displayName: "Source File ID",
      description:
        "The ID of the file to copy. If both path and file ID are provided, file ID takes precedence.",
      required: false,
    }),
    toFolderPath: Property.ShortText({
      displayName: "Destination Folder Path",
      description:
        "The path of the destination folder (e.g. /Backups)",
      required: false,
    }),
    toFolderId: Property.Number({
      displayName: "Destination Folder ID",
      description:
        "The ID of the destination folder. If both destination path and folder ID are provided, folder ID takes precedence.",
      required: false,
    }),
    overwrite: Property.Checkbox({
      displayName: "Overwrite",
      description:
        "If set to true, overwrites the file if it already exists at the destination.",
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.fileId !== undefined && context.propsValue.fileId !== null) {
      queryParams["fileid"] = String(context.propsValue.fileId);
    } else if (context.propsValue.filePath) {
      queryParams["path"] = context.propsValue.filePath;
    } else {
      throw new Error("Either source file path or file ID must be provided.");
    }

    if (context.propsValue.toFolderId !== undefined && context.propsValue.toFolderId !== null) {
      queryParams["tofolderid"] = String(context.propsValue.toFolderId);
    } else if (context.propsValue.toFolderPath) {
      queryParams["topath"] = context.propsValue.toFolderPath;
    } else {
      throw new Error(
        "Either destination folder path or folder ID must be provided."
      );
    }

    if (!context.propsValue.overwrite) {
      queryParams["noover"] = "1";
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${getPcloudApiUrl(context.auth)}/copyfile`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
