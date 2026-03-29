import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { pcloudAuth } from "../../index";

export const listFolder = createAction({
  auth: pcloudAuth,
  name: "list_folder",
  displayName: "List Folder",
  description: "List the contents of a folder in pCloud",
  props: {
    folder_id: Property.Number({
      displayName: "Folder ID",
      description: "The ID of the folder to list (0 for root)",
      required: true,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { folder_id } = context.propsValue;
    const { access_token } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: "https://api.pcloud.com/listfolder",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      queryParams: {
        folderid: folder_id.toString(),
      },
    });

    return response.body;
  },
});
