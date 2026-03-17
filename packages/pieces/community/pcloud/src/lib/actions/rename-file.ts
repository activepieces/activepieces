import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth } from "../auth";

export const pcloudRenameFile = createAction({
  auth: pcloudAuth,
  name: "rename_pcloud_file",
  description: "Rename or move a file in pCloud",
  displayName: "Rename/Move File",
  props: {
    filePath: Property.ShortText({
      displayName: "Source File Path",
      description:
        "The current path of the file (e.g. /Documents/oldname.pdf)",
      required: false,
    }),
    fileId: Property.Number({
      displayName: "Source File ID",
      description:
        "The ID of the file to rename/move. If both path and file ID are provided, file ID takes precedence.",
      required: false,
    }),
    toPath: Property.ShortText({
      displayName: "Destination Path",
      description:
        "The new full path for the file (e.g. /Documents/newname.pdf). Use this to rename or move the file.",
      required: false,
    }),
    toFolderId: Property.Number({
      displayName: "Destination Folder ID",
      description:
        "The ID of the folder to move the file to. Used with new name for moving files.",
      required: false,
    }),
    toName: Property.ShortText({
      displayName: "New File Name",
      description:
        "The new name for the file (e.g. newname.pdf). Used with destination folder ID.",
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

    if (context.propsValue.toPath) {
      queryParams["topath"] = context.propsValue.toPath;
    } else if (
      context.propsValue.toFolderId !== undefined &&
      context.propsValue.toFolderId !== null
    ) {
      queryParams["tofolderid"] = String(context.propsValue.toFolderId);
      if (context.propsValue.toName) {
        queryParams["toname"] = context.propsValue.toName;
      }
    } else if (context.propsValue.toName) {
      queryParams["toname"] = context.propsValue.toName;
    } else {
      throw new Error(
        "Either destination path, destination folder ID, or new name must be provided."
      );
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: "https://api.pcloud.com/renamefile",
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
