import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth, getPcloudApiUrl } from "../auth";

export const pcloudDeleteFolder = createAction({
  auth: pcloudAuth,
  name: "delete_pcloud_folder",
  description: "Delete a folder and all its contents from pCloud",
  displayName: "Delete Folder",
  props: {
    path: Property.ShortText({
      displayName: "Path",
      description: "The path of the folder to delete (e.g. /Documents/OldFolder)",
      required: false,
    }),
    folderId: Property.Number({
      displayName: "Folder ID",
      description:
        "The ID of the folder to delete. If both path and folder ID are provided, folder ID takes precedence.",
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.folderId !== undefined && context.propsValue.folderId !== null) {
      queryParams["folderid"] = String(context.propsValue.folderId);
    } else if (context.propsValue.path) {
      queryParams["path"] = context.propsValue.path;
    } else {
      throw new Error("Either path or folder ID must be provided.");
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${getPcloudApiUrl(context.auth)}/deletefolderrecursive`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
