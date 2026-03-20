import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, baseUrl } from "../common";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const addJobAttachment = createAction({
  auth: housecallProAuth,
  name: "add_job_attachment",
  displayName: "Add an attachment to a job",
  description: "Upload an attachment to a job",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job to add attachment to",
      required: true,
    }),
    file: Property.File({
      displayName: "File",
      description: "The file to upload",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { job_id, file } = propsValue;

    const formData = new FormData();
    const blob = new Blob([file.data] as unknown as BlobPart[], { type: "application/octet-stream" });
    formData.append("file", blob, file.filename);

    const response = await httpClient.sendRequest({
      url: `${baseUrl}/jobs/${job_id}/attachments`,
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
