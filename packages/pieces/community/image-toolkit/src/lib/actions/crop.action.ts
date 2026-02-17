import sharp from "sharp";
import { createAction, Property } from "@activepieces/pieces-framework";

export const cropImage = createAction({
  name: "crop_image",
  displayName: "Crop Image",
  description: "Crop a region from the image.",

  props: {
    inputFile: Property.File({
      displayName: "Input Image",
      required: true,
    }),
    left: Property.Number({ displayName: "Left", required: true }),
    top: Property.Number({ displayName: "Top", required: true }),
    width: Property.Number({ displayName: "Width", required: true }),
    height: Property.Number({ displayName: "Height", required: true }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const file = p["inputFile"];

    const raw = file.data;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const output = await sharp(buffer)
      .extract({
        left: p["left"],
        top: p["top"],
        width: p["width"],
        height: p["height"],
      })
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
