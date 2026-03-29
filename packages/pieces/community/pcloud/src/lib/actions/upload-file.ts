import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { pcloudAuth } from "../../index";

export const uploadFile = createAction({
  auth: pcloudAuth,
  name: "upload_file",
  displayName: "Upload File",
  description: "Upload a file to pCloud",
  props: {
    folder_id: Property.Number({
      displayName: "Folder ID",
      description: "The ID of the folder to upload the file to (0 for root)",
      required: true,
      defaultValue: 0,
    }),
    file: Property.File({
      displayName: "File",
      description: "The file to upload",
      required: true,
    }),
  },
  async run(context) {
    const { folder_id, file } = context.propsValue;
    const { access_token } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: "https://api.pcloud.com/uploadfile",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      queryParams: {
        folderid: folder_id.toString(),
      },
      body: {
        file: file.data,
      },
    });

    return response.body;
  },
});
