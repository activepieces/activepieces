import sharp from "sharp";
import { createAction, Property } from "@activepieces/pieces-framework";

export const removeMetadata = createAction({
  name: "remove_metadata",
  displayName: "Remove Metadata",
  description: "Remove all EXIF and metadata from the image.",

  props: {
    inputFile: Property.File({
      displayName: "Input Image",
      required: true,
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const inputFile = p["inputFile"];
    const raw = inputFile.data;

    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    // Sharpen the buffer without metadata
    const output = await sharp(buffer).toBuffer(); // metadata removed by default

    return {
      success: true,
      outputFile: {
        data: output.toString("base64"),
        type: inputFile.type ?? "image/png",
        extension: inputFile.extension ?? "png",
      },
    };
  },
});
