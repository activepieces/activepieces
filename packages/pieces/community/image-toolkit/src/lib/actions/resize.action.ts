import sharp from "sharp";
import { createAction, Property } from "@activepieces/pieces-framework";

export const resizeImage = createAction({
  name: "resize_image",
  displayName: "Resize Image",
  description: "Resize an image to the specified width and height.",

  props: {
    inputFile: Property.File({
      displayName: "Input Image",
      required: true,
    }),
    width: Property.Number({
      displayName: "Width",
      required: true,
    }),
    height: Property.Number({
      displayName: "Height",
      required: true,
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const file = p["inputFile"];

    const raw = file.data;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const output = await sharp(buffer)
      .resize(p["width"], p["height"])
      .toBuffer();

    return {
      outputFile: {
        data: output.toString("base64"),
        type: file.type ?? "image/png",
        extension: file.extension ?? "png",
      },
    };
  },
});
