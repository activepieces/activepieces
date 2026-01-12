import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, baseUrl } from "../common";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const createEstimateOptionAttachment = createAction({
  auth: housecallProAuth,
  name: "create_estimate_option_attachment",
  displayName: "Create estimate option attachment",
  description: "Upload an attachment to an estimate option",
  props: {
    estimate_id: Property.ShortText({ displayName: "Estimate ID", required: true }),
    option_id: Property.ShortText({ displayName: "Option ID", required: true }),
    file: Property.File({ displayName: "File", required: true }),
  },
  async run({ auth, propsValue }) {
    const { estimate_id, option_id, file } = propsValue;

    const formData = new FormData();
    const blob = new Blob([file.data] as unknown as BlobPart[], { type: "application/octet-stream" });
    formData.append("file", blob, file.filename);

    const response = await httpClient.sendRequest({
      url: `${baseUrl}/estimates/${estimate_id}/options/${option_id}/attachments`,
      method: HttpMethod.POST,
      headers: {
        "Authorization": `Token ${auth}`,
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    return response.body;
  },
});


