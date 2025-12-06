import { createAction, Property } from "@activepieces/pieces-framework";

export const extractText = createAction({
  name: "extract_text",
  displayName: "Extract Text",
  description:
    "Extract text from a PDF (Not supported by pdf-lib — awaiting maintainers decision).",
  props: {
    pdf: Property.File({ displayName: "PDF", required: true }),
  },

  async run() {
    throw new Error(
      "Text extraction is not supported by pdf-lib. PDF Toolkit will support it when maintainers approve a text extraction library."
    );
  },
});
