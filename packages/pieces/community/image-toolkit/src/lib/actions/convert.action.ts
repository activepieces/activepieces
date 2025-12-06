import sharp from "sharp";
import { createAction, Property } from "@activepieces/pieces-framework";

export const convertImage = createAction({
  name: "convert_image",
  displayName: "Convert Image Format",
  description: "Convert an image to PNG, JPEG, WEBP or AVIF.",

  props: {
    inputFile: Property.File({
      displayName: "Input Image",
      required: true,
    }),

    format: Property.StaticDropdown({
      displayName: "Output Format",
      required: true,
      options: {
        options: [
          { label: "PNG", value: "png" },
          { label: "JPEG", value: "jpeg" },
          { label: "WEBP", value: "webp" },
          { label: "AVIF", value: "avif" },
        ],
      },
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const file = p["inputFile"];
    const format = p["format"];

    const raw = file.data;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    let pipeline = sharp(buffer);

    switch (format) {
      case "png":
        pipeline = pipeline.png();
        break;
      case "jpeg":
        pipeline = pipeline.jpeg();
        break;
      case "webp":
        pipeline = pipeline.webp();
        break;
      case "avif":
        pipeline = pipeline.avif();
        break;
    }

    const output = await pipeline.toBuffer();

    return {
      outputFile: {
        data: output.toString("base64"),
        type: `image/${format}`,
        extension: format,
      },
    };
  },
});
