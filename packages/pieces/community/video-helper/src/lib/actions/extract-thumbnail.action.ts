import { createAction, Property } from "@activepieces/pieces-framework";
import ffmpeg from "fluent-ffmpeg";
import { File } from "@activepieces/shared";
import fs from "fs";
import os from "os";
import path from "path";

export const extractThumbnail = createAction({
  name: "extract_thumbnail",
  displayName: "Extract Thumbnail",
  description: "Extract a single frame as an image from a video.",
  props: {
    inputFile: Property.File({
      displayName: "Video File",
      required: true,
    }),
    timestamp: Property.ShortText({
      displayName: "Timestamp (e.g. 00:00:02)",
      required: true,
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const inputFile = p["inputFile"];

    const raw = inputFile.data;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const tmpIn = path.join(os.tmpdir(), `vid-${Date.now()}.mp4`);
    const tmpOut = path.join(os.tmpdir(), `thumb-${Date.now()}.png`);

    await fs.promises.writeFile(tmpIn, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpIn)
        .screenshots({
          timestamps: [p["timestamp"]],
          filename: path.basename(tmpOut),
          folder: path.dirname(tmpOut),
        })
        .on("end", () => resolve())
        .on("error", (err: any) => reject(err));
    });

    const output = await fs.promises.readFile(tmpOut);

    return {
      success: true,
      outputFile: {
        data: output.toString("base64"),
        type: "image/png",
        extension: "png",
      },
    };
  },
});
