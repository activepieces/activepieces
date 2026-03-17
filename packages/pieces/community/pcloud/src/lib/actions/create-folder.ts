import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth, getPcloudApiUrl } from "../auth";

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: "create_pcloud_folder",
  description: "Create a new folder (creates if it does not already exist)",
  displayName: "Create Folder",
  props: {
    path: Property.ShortText({
      displayName: "Path",
      description:
        "The full path for the new folder (e.g. /Documents/NewFolder). Either path or parent folder ID + name must be provided.",
      required: false,
    }),
    parentFolderId: Property.Number({
      displayName: "Parent Folder ID",
      description:
        "The ID of the parent folder. Use 0 for root. Used together with folder name.",
      required: false,
    }),
    name: Property.ShortText({
      displayName: "Folder Name",
      description:
        "The name of the new folder. Used together with parent folder ID.",
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.path) {
      queryParams["path"] = context.propsValue.path;
    } else if (
      context.propsValue.parentFolderId !== undefined &&
      context.propsValue.parentFolderId !== null &&
      context.propsValue.name
    ) {
      queryParams["folderid"] = String(context.propsValue.parentFolderId);
      queryParams["name"] = context.propsValue.name;
    } else {
      throw new Error(
        "Either path or both parent folder ID and folder name must be provided."
      );
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${getPcloudApiUrl(context.auth)}/createfolderifnotexists`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const body = result.body as { result: number; error?: string };
    if (body.result !== 0) {
      throw new Error(`pCloud error: ${body.error ?? "result code " + body.result}`);
    }
    return body;
  },
});
