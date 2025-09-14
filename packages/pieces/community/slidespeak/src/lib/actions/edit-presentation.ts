import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";


export const editPresentation = createAction({
  name: "edit_presentation",
  displayName: "Edit Presentation",
  description: "Edits an existing PPTX by replacing shapes with new content",
  props: {
    pptx_file: Property.File({
      displayName: "PPTX File",
      description: "Upload the PPTX file you want to edit",
      required: true,
    }),
    config: Property.Json({
      displayName: "Config",
      description:
        "JSON object containing replacements. Example: { \"replacements\": [{\"shape_name\": \"TARGET_TITLE\", \"content\": \"New Title\"}] }",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append("pptx_file", propsValue.pptx_file as any);
    form.append("config", JSON.stringify(propsValue.config));

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      "/presentation/edit",
      form
    );
    return response;
  },
});
