import sharp from "sharp";
import { createAction, Property } from "@activepieces/pieces-framework";

export const compressImage = createAction({
  name: "compress_image",
  displayName: "Compress Image",
  description: "Compress an image using the specified quality (1-100).",

  props: {
    inputFile: Property.File({
      displayName: "Input Image",
      required: true,
    }),

    quality: Property.Number({
      displayName: "Quality (1-100)",
      required: true,
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const file = p["inputFile"];
    const quality = p["quality"];

    const raw = file.data;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const ext = file.extension?.toLowerCase() || "jpeg";

    let pipeline = sharp(buffer);

    switch (ext) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({ quality });
        break;
      case "png":
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
      case "webp":
        pipeline = pipeline.webp({ quality });
        break;
      case "avif":
        pipeline = pipeline.avif({ quality });
        break;
      default:
        pipeline = pipeline.jpeg({ quality });
    }

    const output = await pipeline.toBuffer();

    return {
      outputFile: {
        data: output.toString("base64"),
        type: `image/${ext}`,
        extension: ext,
      },
      originalSize: buffer.length,
      newSize: output.length,
      quality,
    };
  },
});
