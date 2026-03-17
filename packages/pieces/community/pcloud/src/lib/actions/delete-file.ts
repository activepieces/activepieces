import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth, getPcloudApiUrl } from "../auth";

export const pcloudDeleteFile = createAction({
  auth: pcloudAuth,
  name: "delete_pcloud_file",
  description: "Delete a file from pCloud",
  displayName: "Delete File",
  props: {
    path: Property.ShortText({
      displayName: "Path",
      description:
        "The path of the file to delete (e.g. /Documents/report.pdf)",
      required: false,
    }),
    fileId: Property.Number({
      displayName: "File ID",
      description:
        "The ID of the file to delete. If both path and file ID are provided, file ID takes precedence.",
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

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${getPcloudApiUrl(context.auth)}/deletefile`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
