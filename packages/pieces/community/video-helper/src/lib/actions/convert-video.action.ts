import { createAction, Property } from "@activepieces/pieces-framework";
import ffmpeg from "fluent-ffmpeg";
import { File } from "@activepieces/shared";
import fs from "fs";
import os from "os";
import path from "path";

export const convertVideo = createAction({
  name: "convert_video",
  displayName: "Convert Video",
  description: "Convert a video to MP4, WEBM, or GIF.",
  props: {
    inputFile: Property.File({
      displayName: "Video File",
      required: true,
    }),

    format: Property.StaticDropdown({
      displayName: "Output Format",
      required: true,
      options: {
        options: [
          { label: "MP4", value: "mp4" },
          { label: "WEBM", value: "webm" },
          { label: "GIF", value: "gif" },
        ],
      },
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const inputFile = p["inputFile"];
    const format = p["format"];

    const raw = inputFile.data;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const tmpIn = path.join(os.tmpdir(), `cvt-${Date.now()}.in`);
    const tmpOut = path.join(os.tmpdir(), `cvt-${Date.now()}.${format}`);

    await fs.promises.writeFile(tmpIn, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpIn)
        .output(tmpOut)
        .on("end", () => resolve())
        .on("error", (err: any) => reject(err))
        .run();
    });

    const output = await fs.promises.readFile(tmpOut);

    return {
      success: true,
      outputFile: {
        data: output.toString("base64"),
        type: `video/${format === "gif" ? "gif" : format}`,
        extension: format,
      },
    };
  },
});
