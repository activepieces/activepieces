import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";

export const uploadDocument = createAction({
  name: "upload_document",
  displayName: "Upload Document",
  description:
    "Uploads a document (PPT, Word, Excel, PDF) to SlideSpeak for later use in presentation generation.",
  props: {
    file: Property.File({
      displayName: "Document File",
      description:
        "Upload a document file (.pptx, .ppt, .docx, .doc, .xlsx, .pdf). Once uploaded, it can be used in Generate Presentation.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append("file", propsValue.file as any);

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      "/document/upload",
      form
    );
  },
});
