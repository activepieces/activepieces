import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaMcpAuth } from "../../index";

export const getDesignTool = createAction({
  auth: canvaMcpAuth,
  name: "get_design",
  displayName: "Get Design",
  description: "Get details of a specific design in Canva",
  props: {
    design_id: Property.ShortText({
      displayName: "Design ID",
      description: "The ID of the design to retrieve",
      required: true,
    }),
  },
  async run(context) {
    const { design_id } = context.propsValue;
    const { access_token } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.canva.com/v1/designs/${design_id}`,
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.body;
  },
});
