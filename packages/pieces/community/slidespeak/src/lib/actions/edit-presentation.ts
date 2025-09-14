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
    replacements: Property.Array({
      displayName: 'Replacements',
      description: 'A list of shapes to replace and their new content.',
      required: true,
      properties: {
        shape_name: Property.ShortText({
          displayName: 'Shape Name',
          description: 'The name of the shape in the presentation to target.',
          required: true,
        }),
        content: Property.LongText({
          displayName: 'New Content',
          description: 'The new text or image URL for the shape.',
          required: true,
        }),
      }
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append("pptx_file", propsValue.pptx_file as any);
    form.append("config", JSON.stringify(propsValue.replacements));

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      "/presentation/edit",
      form
    );
    return response;
  },
});
