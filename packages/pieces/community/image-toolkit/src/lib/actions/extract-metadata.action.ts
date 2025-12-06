import sharp from "sharp";
import { createAction, Property } from "@activepieces/pieces-framework";

export const extractMetadata = createAction({
  name: "extract_metadata",
  displayName: "Extract Metadata",
  description: "Extract EXIF / metadata from the image.",

  props: {
    inputFile: Property.File({
      displayName: "Input Image",
      required: true,
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const file = p["inputFile"];

    const raw = file.data;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const metadata = await sharp(buffer).metadata();

    return {
      metadata,
    };
  },
});
