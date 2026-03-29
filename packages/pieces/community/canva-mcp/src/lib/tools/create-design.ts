import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaMcpAuth } from "../../index";

export const createDesignTool = createAction({
  auth: canvaMcpAuth,
  name: "create_design",
  displayName: "Create Design",
  description: "Create a new design in Canva",
  props: {
    folder_id: Property.ShortText({
      displayName: "Folder ID",
      description: "The ID of the folder to create the design in. Leave blank for root.",
      required: false,
    }),
    name: Property.ShortText({
      displayName: "Design Name",
      description: "The name of the design",
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: "Template ID",
      description: "The ID of the template to use. Leave blank to create from scratch.",
      required: false,
    }),
  },
  async run(context) {
    const { folder_id, name, template_id } = context.propsValue;
    const { access_token } = context.auth;

    const payload: any = {
      folder_id: folder_id,
      name: name,
    };

    if (template_id) {
      payload.template_id = template_id;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: "https://api.canva.com/v1/designs",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    return response.body;
  },
});
