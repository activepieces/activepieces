import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaMcpAuth } from "../../index";

export const listDesignsTool = createAction({
  auth: canvaMcpAuth,
  name: "list_designs",
  displayName: "List Designs",
  description: "List designs in a specific folder in Canva",
  props: {
    folder_id: Property.ShortText({
      displayName: "Folder ID",
      description: "The ID of the folder to list designs from. Leave blank for root.",
      required: false,
    }),
  },
  async run(context) {
    const { folder_id } = context.propsValue;
    const { access_token } = context.auth;

    const params: Record<string, string> = {};
    if (folder_id) {
      params.folder_id = folder_id;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: "https://api.canva.com/v1/designs",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      queryParams: params,
    });

    return response.body;
  },
});
