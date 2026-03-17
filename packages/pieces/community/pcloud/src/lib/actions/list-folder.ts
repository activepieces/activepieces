import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth } from "../auth";

export const pcloudListFolder = createAction({
  auth: pcloudAuth,
  name: "list_pcloud_folder",
  description: "List the contents of a folder",
  displayName: "List Folder",
  props: {
    path: Property.ShortText({
      displayName: "Path",
      description:
        "The path of the folder to list (e.g. /Documents). Use / for the root folder.",
      required: false,
    }),
    folderId: Property.Number({
      displayName: "Folder ID",
      description:
        "The ID of the folder to list. Use 0 for the root folder. If both path and folder ID are provided, folder ID takes precedence.",
      required: false,
    }),
    recursive: Property.Checkbox({
      displayName: "Recursive",
      description:
        "If set to true, returns contents of subfolders recursively.",
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, string | number | boolean> = {};

    if (context.propsValue.folderId !== undefined && context.propsValue.folderId !== null) {
      params["folderid"] = context.propsValue.folderId;
    } else if (context.propsValue.path) {
      params["path"] = context.propsValue.path;
    } else {
      params["folderid"] = 0;
    }

    if (context.propsValue.recursive) {
      params["recursive"] = 1;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: "https://api.pcloud.com/listfolder",
      queryParams: Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
