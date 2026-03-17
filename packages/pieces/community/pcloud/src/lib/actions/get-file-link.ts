import { createAction, Property } from "@activepieces/pieces-framework";
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { pcloudAuth, getPcloudApiUrl } from "../auth";

export const pcloudGetFileLink = createAction({
  auth: pcloudAuth,
  name: "get_pcloud_file_link",
  description: "Get a download link for a file in pCloud",
  displayName: "Get File Link",
  props: {
    path: Property.ShortText({
      displayName: "Path",
      description:
        "The path of the file (e.g. /Documents/report.pdf)",
      required: false,
    }),
    fileId: Property.Number({
      displayName: "File ID",
      description:
        "The ID of the file. If both path and file ID are provided, file ID takes precedence.",
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
      url: `${getPcloudApiUrl(context.auth)}/getfilelink`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const body = result.body as { hosts: string[]; path: string };
    const downloadUrl = `https://${body.hosts[0]}${body.path}`;

    return {
      ...result.body,
      downloadUrl,
    };
  },
});
